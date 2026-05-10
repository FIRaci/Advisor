import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

router.use(authMiddleware);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai_service:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const AI_MODE = process.env.AI_MODE || 'auto'; // 'auto' | 'mock' | 'live'
const AI_TIMEOUT_MS = 12_000;

function shouldUseLiveAi(): boolean {
  if (AI_MODE === 'mock') return false;
  if (AI_MODE === 'live') return true;
  // auto: live only when key looks valid (length-based heuristic)
  return GEMINI_API_KEY.length > 30;
}

function detectStrategyKind(content: string): { kind: string | null; metadata: Record<string, unknown> | null } {
  if (content.includes('[PLAN_OPTIONS]')) {
    return { kind: 'plan_options', metadata: null };
  }
  if (content.includes('[STAGE_TRANSITION]')) {
    return { kind: 'stage_transition', metadata: null };
  }
  return { kind: null, metadata: null };
}

const vietnameseCharacterRegex = /[\u00C0-\u1EF9]/;

function buildAiFallbackResponse(message: string): string {
  const isVietnamese = vietnameseCharacterRegex.test(message);

  if (isVietnamese) {
    return [
      'Xin loi, he thong AI dang tam thoi qua tai nen chua the tra loi day du ngay luc nay.',
      '',
      'Ban co the tiep tuc bang cach:',
      '- Thu gui lai yeu cau sau it giay',
      '- Dat cau hoi ngan gon hon (muc tieu, ngan sach, doi tuong)',
      '- Neu can, toi co the dua khung chien luoc mau de ban bat dau ngay'
    ].join('\n');
  }

  return [
    'Sorry, the AI service is temporarily unavailable so I could not generate a full response right now.',
    '',
    'You can continue by:',
    '- Retrying in a few seconds',
    '- Sending a shorter prompt (goal, budget, audience)',
    '- Asking for a starter campaign template to begin immediately'
  ].join('\n');
}

const sendMessageSchema = z.object({
  message: z.string().trim().min(1).max(10_000),
  campaignId: z.string().trim().min(1).optional(),
  context: z.record(z.any()).optional()
});

const historyQuerySchema = z.object({
  campaignId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200)
});

const campaignQuerySchema = z.object({
  campaignId: z.string().trim().min(1).optional()
});

// Send message to AI
router.post('/message', async (req: AuthRequest, res) => {
  try {
    const { message, campaignId, context } = sendMessageSchema.parse(req.body);

    let campaign: {
      id: string;
      name: string;
      quizData: unknown;
      quizProgress: unknown;
      strategy: unknown;
    } | null = null;
    if (campaignId) {
      campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, userId: req.userId },
        select: { id: true, name: true, quizData: true, quizProgress: true, strategy: true }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    // Save user message (Strategy pane)
    const savedUserMessage = await prisma.chat.create({
      data: {
        role: 'USER',
        pane: 'STRATEGY',
        content: message,
        userId: req.userId!,
        campaignId: campaign?.id
      }
    });

    // Build context: fetch quiz data from campaign if available
    let aiContext = context || {};
    if (campaign?.quizData) {
      aiContext = {
        ...aiContext,
        quizData: campaign.quizData,
        quizProgress: campaign.quizProgress,
        strategy: campaign.strategy,
        campaignName: campaign.name
      };
    }

    if (campaign?.id) {
      const snapshots = await prisma.campaignMetricsSnapshot.findMany({
        where: { campaignId: campaign.id },
        orderBy: { periodEnd: 'desc' },
        take: 2
      });

      if (snapshots.length > 0) {
        aiContext = {
          ...aiContext,
          latestMetrics: snapshots[0],
          previousMetrics: snapshots[1]
        };
      }
    }

    // Call AI service with timeout and graceful fallback
    let aiText = '';
    let usedFallback = false;

    try {
      if (shouldUseLiveAi()) {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const phase = (aiContext.quizData as any)?.phase || '1';
        let stageInstructions = '';
        
        if (phase === '1') {
          stageInstructions = `
You are currently in Stage 1 (Strategy Formulation).
IMPORTANT INSTRUCTIONS:
1. First, provide a highly detailed, insightful analysis of the user's business, target audience, and goals. Provide actionable suggestions and explain the "why" behind your thinking. Do NOT just give options immediately. Give them a robust strategy breakdown first.
2. After your detailed analysis, provide between 1 to 3 strategic plan options (depending on what you think is most effective) using the exact formatting below:
**[PLAN_OPTIONS]**
[PLAN_A]
**Plan A: <Title>**
<Description>
- Budget: ...
- Timeline: ...
- Expected ROI: ...
[/PLAN_A]
... (Repeat for PLAN_B and PLAN_C if needed)
[/PLAN_OPTIONS]`;
        } else if (phase === '2') {
          stageInstructions = `
You are currently in Stage 2 (Execution Plan).
IMPORTANT INSTRUCTIONS:
1. Provide a highly detailed execution plan based on the user's chosen plan from Stage 1. Break down the channel strategy, timeline, milestones, and budget. Explain why this execution plan will work.
2. At the very end of your response, you MUST include this exact string to allow the user to transition to Stage 3:
**[STAGE_TRANSITION]** You have completed Stage 2! You can now move to **Stage 3: Ongoing Optimization**.`;
        } else if (phase === '3') {
          stageInstructions = `
You are currently in Stage 3 (Ongoing Optimization).
IMPORTANT INSTRUCTIONS:
1. Analyze any metrics snapshots provided. Give a highly detailed breakdown of performance, identify bottlenecks, and suggest concrete optimizations (e.g., budget shifts, new creatives). Provide deep reasoning for your suggestions.`;
        }

        const prompt = `You are AdVisor, an expert AI marketing strategist. Your role is to help businesses create effective marketing campaigns. Provide actionable advice, consider budget constraints, and focus on ROI.

${stageInstructions}

Context about the campaign:
${JSON.stringify(aiContext, null, 2)}

User: ${message}`;

        const result = await model.generateContent(prompt);
        aiText = result.response.text();
      } else {
        throw new Error('Using mock mode');
      }
    } catch (aiError) {
      usedFallback = true;
      console.error('AI upstream error (falling back to mock):', aiError);
      
      const msgLower = message.toLowerCase();
      const quizData = campaign ? await prisma.campaign.findUnique({ where: { id: campaign.id }, select: { quizData: true } }) : null;
      const phase = (quizData?.quizData as any)?.phase || '1';
      const selectedPlan = (quizData?.quizData as any)?.selectedPlan;

      if (msgLower.includes('stage 3') || msgLower.includes('giai đoạn 3') || phase === '3' || msgLower.includes('report') || msgLower.includes('báo cáo')) {
        const goal = (quizData?.quizData as any)?.goal || 'your objectives';
        const productName = (quizData?.quizData as any)?.productName || 'your product';
        aiText = `## Stage 3: Ongoing Optimization for ${productName}

Thank you for your metrics report! I've conducted a deep dive into your recent performance data to identify bottlenecks and growth opportunities for achieving ${goal}. It looks like your initial ad sets have gathered enough data for statistical significance.

### Performance Summary
- Your campaign for **${productName}** is performing **well** overall with room for improvement.
- **CPC** and **CPA** trends look healthy, but ad fatigue might be setting in on your primary channel.
- The engagement rate is solid, indicating your audience targeting for ${goal} is on the right track.

### Recommendations
1. **Increase budget** on top-performing ad sets by 15-20% to scale success.
2. **Pause underperformers** with CPA above your target threshold to preserve budget.
3. **Test new creatives** — refresh ad fatigue every 2-3 weeks to maintain CTR.
4. **Expand audience** using lookalike segments from your best converters.

### Next Steps
- Submit your next metrics snapshot in **2 weeks**.
- Focus on retention campaigns this period to increase LTV.

*Keep submitting periodic reports and I'll track your progress over time!*`;
      } else if (msgLower.includes('selected plan') || msgLower.includes('chốt plan') || msgLower.includes('chọn plan') || selectedPlan) {
        if (phase === '2' || msgLower.includes('stage 2') || msgLower.includes('giai đoạn 2')) {
          aiText = `## Stage 2: Refined Execution Plan

I've reviewed your chosen plan and your specific preferences. The key to executing this plan successfully is strict budget allocation and a phased rollout to minimize risk. By focusing on your most engaged demographics first, we can secure early wins before scaling. 

Here is your detailed execution plan:

### Channel Strategy
- **Primary:** Social Media (TikTok + Instagram) — 50% budget
- **Secondary:** Google Ads (Search + Display) — 30% budget  
- **Support:** Email + Content Marketing — 20% budget

### Timeline & Milestones
| Week | Action | KPI Target |
| :--- | :--- | :--- |
| **1-2** | Campaign setup & creative production | 5+ ad variants |
| **3-4** | Launch & A/B testing phase | CTR > 2% |
| **5-8** | Optimization & scaling | CPA < $15 |
| **9-12** | Retention & community building | LTV +20% |

### Budget Breakdown
- Ad Spend: 60% | Content: 25% | Tools: 15%

---

**[STAGE_TRANSITION]** You have completed Stage 2! You can now move to **Stage 3: Ongoing Optimization** where you'll submit periodic reports and I'll help you continuously improve your results.`;
        const business = (quizData?.quizData as any)?.business || 'your business';
        const goal = (quizData?.quizData as any)?.goal || 'your primary goal';
        const audience = (quizData?.quizData as any)?.audience || 'target audience';
        
        aiText = `## Strategic Analysis & Recommendations

I've carefully analyzed your profile for **${business}**. To achieve your goal of **${goal}** with the **${audience}** segment, I recommend a multi-channel approach that prioritizes high-intent search traffic combined with social proof.

### Key Insights:
- **Audience Behavior:** Your ${audience} demographic responds best to value-driven messaging and clear CTAs.
- **Market Position:** Focusing on your unique selling points will help differentiate ${business} from established competitors.
- **Channel Optimization:** I suggest allocating a larger portion of the initial budget to testing creative variants on your primary channel.

### Strategic Suggestions:
1. **Focus on conversion-centric copy** that addresses the specific pain points of ${audience}.
2. **Implement a retargeting layer** early on to capture users who don't convert on the first touch.
3. **Optimize for ROI** by scaling only the ad sets that meet your target CPA within the first 14 days.

Based on these insights, I've prepared **3 strategic plans** for you to choose from. Review the options below and select the one that best matches your current capacity:

---

**[PLAN_OPTIONS]**
[PLAN_A]
**Plan A: Growth Accelerator**
Focus on rapid customer acquisition through paid channels.
- Budget allocation: 70% Paid Ads, 20% Content, 10% Email
- Timeline: 3 months aggressive push
- Expected ROI: 3-4x within 90 days
- Best for: Fast results, higher initial spend
[/PLAN_A]
[PLAN_B]
**Plan B: Organic Builder**
Build sustainable growth through content and community.
- Budget allocation: 30% Paid Ads, 50% Content, 20% Community
- Timeline: 6 months steady growth
- Expected ROI: 5-7x within 6 months
- Best for: Long-term brand building, lower cost
[/PLAN_B]
[PLAN_C]
**Plan C: Hybrid Strategy**
Balance between paid acquisition and organic growth.
- Budget allocation: 50% Paid Ads, 30% Content, 20% Email/Community
- Timeline: 4 months balanced approach
- Expected ROI: 4-5x within 4 months
- Best for: Balanced risk, steady scaling
[/PLAN_C]
[/PLAN_OPTIONS]

Select a plan above to proceed to **Stage 2** where we'll refine the details!`;
        }
      } else if (msgLower.includes('quiz') || msgLower.includes('plan') || msgLower.includes('strategy') || msgLower.includes('chiến lược')) {
        aiText = `## Your Personalized Marketing Strategy

Based on your quiz responses, I've prepared **3 strategic plans** for you to choose from:

---

**[PLAN_OPTIONS]**
[PLAN_A]
**Plan A: Growth Accelerator**
Focus on rapid customer acquisition through paid channels.
- Budget allocation: 70% Paid Ads, 20% Content, 10% Email
- Timeline: 3 months aggressive push
- Expected ROI: 3-4x within 90 days
- Best for: Fast results, higher initial spend
[/PLAN_A]
[PLAN_B]
**Plan B: Organic Builder**
Build sustainable growth through content and community.
- Budget allocation: 30% Paid Ads, 50% Content, 20% Community
- Timeline: 6 months steady growth
- Expected ROI: 5-7x within 6 months
- Best for: Long-term brand building, lower cost
[/PLAN_B]
[PLAN_C]
**Plan C: Hybrid Strategy**
Balance between paid acquisition and organic growth.
- Budget allocation: 50% Paid Ads, 30% Content, 20% Email/Community
- Timeline: 4 months balanced approach
- Expected ROI: 4-5x within 4 months
- Best for: Balanced risk, steady scaling
[/PLAN_C]
[/PLAN_OPTIONS]

Select a plan above to proceed to **Stage 2** where we'll refine the details!`;
      } else {
        aiText = `Thank you for your message! As an AI marketing advisor, I can help you with:
- Marketing strategy development
- Target audience analysis  
- Budget allocation recommendations
- Campaign performance optimization

How can I assist you with your campaign today? Try completing the **Quiz** first for a tailored strategy!`;
      }
    }

    // Save AI response (Strategy pane). Tag well-known marker kinds so the frontend
    // can render plan selectors / stage transition cards without prefix sniffing.
    const { kind: assistantKind, metadata: assistantMetadata } = detectStrategyKind(aiText);
    const savedResponse = await prisma.chat.create({
      data: {
        role: 'ASSISTANT',
        pane: 'STRATEGY',
        kind: assistantKind,
        metadata: assistantMetadata as any,
        content: aiText,
        userId: req.userId!,
        campaignId: campaign?.id
      }
    });

    res.json({
      success: true,
      data: {
        userMessage: {
          id: savedUserMessage.id,
          role: 'USER',
          pane: 'STRATEGY',
          kind: null,
          metadata: null,
          content: message,
          createdAt: savedUserMessage.createdAt
        },
        assistantMessage: {
          id: savedResponse.id,
          role: 'ASSISTANT',
          pane: 'STRATEGY',
          kind: assistantKind,
          metadata: assistantMetadata,
          content: aiText,
          createdAt: savedResponse.createdAt,
          fallback: usedFallback
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Content Assistant (Stream 2) - Generates marketing content
const assistSchema = z.object({
  type: z.enum(['email', 'ad_copy', 'social_post', 'landing_page', 'custom']),
  campaignId: z.string().trim().min(1),
  customPrompt: z.string().trim().max(2000).optional()
});

router.post('/assist', async (req: AuthRequest, res) => {
  try {
    const { type, campaignId, customPrompt } = assistSchema.parse(req.body);

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: req.userId },
      select: { id: true, name: true, quizData: true, strategy: true }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const quizData = campaign.quizData as Record<string, string> || {};
    const productName = quizData.productName || 'your product';
    const audience = quizData.audience || 'target audience';
    const goal = quizData.goal || 'increase awareness';

    const chatHistory = await prisma.chat.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'asc' },
      take: 10
    });
    
    const historyText = chatHistory
      .filter(msg => msg.pane === 'STRATEGY')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    let assistText = '';
    let usedFallback = false;

    const contentTypeLabels: Record<string, string> = {
      email: 'Marketing Email',
      ad_copy: 'Ad Copy',
      social_post: 'Social Media Post',
      landing_page: 'Landing Page Copy',
      custom: 'Custom Content'
    };

    try {
      if (shouldUseLiveAi()) {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        
        const assistPrompt = `You are AdVisor Content Assistant, an expert marketing copywriter. Generate high-quality ${contentTypeLabels[type]} content.

Campaign context:
- Product: ${productName}
- Target Audience: ${audience}  
- Goal: ${goal}
- Full quiz data: ${JSON.stringify(quizData)}

Recent Strategy Discussion:
${historyText || 'No previous discussion.'}

${customPrompt ? `User's content request: ${customPrompt}` : ''}

Generate professional, engaging ${contentTypeLabels[type]} content ready to use. Include:
1. The actual content (ready to copy-paste)
2. Key messaging points used
3. A/B variant suggestion

Format with clear markdown.`;

        const result = await model.generateContent(assistPrompt);
        assistText = result.response.text();
      } else {
        throw new Error('Using mock mode');
      }
    } catch (aiError) {
      usedFallback = true;
      
      if (type === 'email') {
        assistText = `## Marketing Email Draft

**Subject Line:** Discover ${productName} — The Smarter Way to Achieve Your Goals

---

Hi [First Name],

Are you tired of struggling with [pain point]? **${productName}** is here to change the game.

### Here's what makes us different:
- **Feature 1:** Save 50% of your time with our smart automation
- **Feature 2:** Join 10,000+ satisfied ${audience} who already trust us
- **Feature 3:** Get results in as little as 7 days

> *"${productName} completely transformed how we work."* — Happy Customer

### Limited Time Offer
Start your free trial today and get **20% off** your first month.

[**Get Started Now →**]

Best regards,  
The ${productName} Team

---
**A/B Variant:** Try "Your ${goal} journey starts here" as subject line.`;
      } else if (type === 'ad_copy') {
        assistText = `## Ad Copy Variants

### Variant A — Problem-Agitation-Solution
**Headline:** Stop Wasting Time on ${goal}  
**Body:** Struggling to reach your ${audience}? ${productName} makes it effortless. 3x faster results.  
**CTA:** Try Free for 14 Days →

### Variant B — Social Proof
**Headline:** 10,000+ Businesses Trust ${productName}  
**Body:** Join successful brands using ${productName} to ${goal}.  
**CTA:** See Why They Switched →

### Variant C — Urgency
**Headline:** Don't Miss Out — ${productName} Launch Offer  
**Body:** For a limited time, get 30% off. The smart way for ${audience} to ${goal}.  
**CTA:** Claim Your Discount →

**Recommended:** Variant A for cold audiences, Variant B for retargeting.`;
      } else if (type === 'social_post') {
        assistText = `## Social Media Content Pack

### Instagram / TikTok
Still doing [old way]? There's a better way.

Meet **${productName}** — built for ${audience} who want real results.

- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Hashtags:** #${productName.replace(/\\s/g, '')} #Marketing #Growth

### LinkedIn
We launched ${productName} to help ${audience} ${goal} — without the complexity.

After 6 months: Our users see 2.5x faster results.

### Twitter/X Thread
Tweet 1: We just helped our 10,000th customer ${goal}. Here's the playbook...  
Tweet 2: Step 1: Identify your ${audience}  
Tweet 3: Step 2: Use ${productName} to automate outreach  
Tweet 4: Step 3: Track, optimize, repeat`;
      } else {
        assistText = `## Generated Content for ${productName}

### Key Message
${productName} helps ${audience} achieve ${goal} faster and more efficiently.

### Draft Content
${customPrompt ? `Here is a drafted response based on: "${customPrompt}"\n\n[This is a generated placeholder. Please configure a valid Gemini API key to get fully personalized content.]` : `Get started with ${productName} today.`}

*Configure your Gemini API key for AI-generated personalized content.*`;
      }
    }

    let savedUserPrompt: { id: string; createdAt: Date } | null = null;
    if (customPrompt) {
      savedUserPrompt = await prisma.chat.create({
        data: {
          role: 'USER',
          pane: 'CONTENT',
          kind: 'content_prompt',
          metadata: { contentType: type } as any,
          content: customPrompt,
          userId: req.userId!,
          campaignId: campaign.id
        }
      });
    }

    const savedAssistant = await prisma.chat.create({
      data: {
        role: 'ASSISTANT',
        pane: 'CONTENT',
        kind: 'content_response',
        metadata: { contentType: type, label: contentTypeLabels[type] } as any,
        content: assistText,
        userId: req.userId!,
        campaignId: campaign.id
      }
    });

    res.json({
      success: true,
      data: {
        type,
        content: assistText,
        fallback: usedFallback,
        userMessage: savedUserPrompt
          ? {
              id: savedUserPrompt.id,
              role: 'USER',
              pane: 'CONTENT',
              kind: 'content_prompt',
              metadata: { contentType: type },
              content: customPrompt,
              createdAt: savedUserPrompt.createdAt
            }
          : null,
        assistantMessage: {
          id: savedAssistant.id,
          role: 'ASSISTANT',
          pane: 'CONTENT',
          kind: 'content_response',
          metadata: { contentType: type, label: contentTypeLabels[type] },
          content: assistText,
          createdAt: savedAssistant.createdAt,
          fallback: usedFallback
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Assist error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Get chat history
router.get('/history', async (req: AuthRequest, res) => {
  try {
    const { campaignId, limit } = historyQuerySchema.parse(req.query);

    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, userId: req.userId },
        select: { id: true }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: req.userId,
        ...(campaignId ? { campaignId } : { campaignId: null })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.json({ success: true, data: chats.reverse() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Clear chat history
router.delete('/history', async (req: AuthRequest, res) => {
  try {
    const { campaignId } = campaignQuerySchema.parse(req.query);

    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, userId: req.userId },
        select: { id: true }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    await prisma.chat.deleteMany({
      where: {
        userId: req.userId,
        ...(campaignId ? { campaignId } : { campaignId: null })
      }
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export default router;
