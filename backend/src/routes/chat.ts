import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import {
  normalizePlanContent,
  appendPlanOptionsIfMissing,
  detectStrategyKind
} from '../utils/plan-marker-parser-and-normalization-utils';

function truncateDeep(obj: any, maxStringLength: number = 2000, maxArrayLength: number = 20): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.length > maxStringLength ? obj.substring(0, maxStringLength) + '...[TRUNCATED]' : obj;
  }
  if (Array.isArray(obj)) {
    let arr = obj;
    if (arr.length > maxArrayLength) {
      arr = arr.slice(0, maxArrayLength);
      arr.push('[TRUNCATED_ARRAY_ELEMENTS]');
    }
    return arr.map(item => truncateDeep(item, maxStringLength, maxArrayLength));
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const [k, v] of Object.entries(obj)) {
      newObj[k] = truncateDeep(v, maxStringLength, maxArrayLength);
    }
    return newObj;
  }
  return obj;
}

const router = Router();

router.use(authMiddleware);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || (process.env.AI_SERVICE_HOSTPORT ? `http://${process.env.AI_SERVICE_HOSTPORT}` : 'http://ai_service:8000');
const AI_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 messages per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' }
});

// Send message to AI
router.post('/message', chatLimiter, async (req: AuthRequest, res) => {
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
        select: { 
          id: true, 
          name: true, 
          quizData: true, 
          quizProgress: true, 
          strategy: true,
          user: { select: { brandProfile: true } }
        }
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
        campaignName: campaign.name,
        brandProfile: (campaign as any).user?.brandProfile || {}
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

    const quizDataObj = aiContext.quizData && typeof aiContext.quizData === 'object' ? aiContext.quizData as Record<string, unknown> : {};
    const effectivePhase = typeof quizDataObj.phase === 'string' ? quizDataObj.phase : '1';

    // Truncate aiContext to prevent Payload Too Large or Token Limit errors
    const safeAiContext = truncateDeep(aiContext, 5000, 50);

    // Call AI service with timeout and graceful fallback
    let aiText = '';
    let usedFallback = false;

    try {
      const response = await fetchWithTimeout(
        `${AI_SERVICE_URL}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            context: safeAiContext
          })
        },
        AI_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`AI Service returned ${response.status}`);
      }

      const data = await response.json() as { response: string };
      aiText = data.response;
    } catch (aiError) {
      usedFallback = true;
      console.error('AI upstream error (falling back to mock):', aiError);

      const msgLower = message.toLowerCase();
      const quizData = campaign ? await prisma.campaign.findUnique({ where: { id: campaign.id }, select: { quizData: true } }) : null;
      const phase = (quizData?.quizData as any)?.phase || '1';
      const selectedPlan = (quizData?.quizData as any)?.selectedPlan;

      if (msgLower.includes('stage 3') || phase === '3' || msgLower.includes('report')) {
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
        if (phase === '2' || msgLower.includes('stage 2')) {
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
        } else {
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
      } else if (msgLower.includes('quiz') || msgLower.includes('plan') || msgLower.includes('strategy')) {
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

    aiText = normalizePlanContent(aiText);

    if (effectivePhase === '1') {
      aiText = appendPlanOptionsIfMissing(aiText);
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
      select: { 
        id: true, 
        name: true, 
        quizData: true, 
        strategy: true,
        user: { select: { brandProfile: true } }
      }
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
      const aiContext = {
        quizData,
        brandProfile: campaign.user?.brandProfile || {},
        historyText
      };
      
      const response = await fetchWithTimeout(
        `${AI_SERVICE_URL}/assist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            message: customPrompt || `Generate 3 distinct variants (A, B, C) for this ${contentTypeLabels[type] || 'content'}. 
Variant A should focus on Pain Points. 
Variant B should focus on Logical Benefits. 
Variant C should focus on FOMO / Urgency. 
Format the response clearly using Markdown headings (e.g. ### Variant A: Pain Point Focus).`,
            context: aiContext
          })
        },
        AI_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`AI Service returned ${response.status}`);
      }

      const data = await response.json() as { response: string };
      assistText = data.response;
    } catch (aiError) {
      usedFallback = true;

      if (type === 'email') {
        assistText = `### Variant A: Pain Point Focus
**Subject Line:** Stop losing time with manual tasks

Hi [First Name],
Are you tired of struggling with [pain point]? **${productName}** automates the heavy lifting so you can focus on what matters.

---

### Variant B: Logical Benefits Focus
**Subject Line:** Discover the smarter way to grow

Hi [First Name],
**${productName}** helps you save 50% of your time while increasing ROI by 2x. Join 10,000+ satisfied ${audience} who trust us.

---

### Variant C: FOMO / Urgency Focus
**Subject Line:** Last chance: Get 20% off ${productName}

Hi [First Name],
Don't get left behind! Offer ends tonight. Start your free trial today and secure your 20% lifetime discount.`;
      } else if (type === 'ad_copy') {
        assistText = `### Variant A: Pain Point Focus
**Headline:** Struggling with [pain point]?
**Body:** Say goodbye to wasted hours. ${productName} automates your workflow effortlessly.
**CTA:** Learn More

---

### Variant B: Logical Benefits Focus
**Headline:** Save 50% Time & Double ROI
**Body:** Join top ${audience} using ${productName} to scale up fast. 
**CTA:** Get Started Free

---

### Variant C: FOMO Focus
**Headline:** Don't miss out - 20% Off Ends Soon!
**Body:** 10,000+ users already upgraded. Secure your spot before the deal is gone.
**CTA:** Claim Offer`;
      } else if (type === 'social_post') {
        assistText = `### Variant A: Pain Point Focus
**Hook:** Struggling with [pain point]?
**Post:** Here is how ${productName} can solve it for you today!
**Call to Action:** Link in bio.

---

### Variant B: Logical Benefits Focus
**Hook:** Why 10k+ users chose ${productName}.
**Post:** Fast, reliable, and affordable for ${audience}. 
**Call to Action:** Try it for free today!

---

### Variant C: FOMO Focus
**Hook:** Last chance to save 20%!
**Post:** The biggest deal for ${productName} ends tonight. Don't let your competitors get ahead.
**Call to Action:** Grab the offer now!`;
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
