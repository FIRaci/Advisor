import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai_service:8000';
const AI_TIMEOUT_MS = 12_000;

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

    let campaign: { id: string; name: string; quizData: unknown } | null = null;
    if (campaignId) {
      campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, userId: req.userId },
        select: { id: true, name: true, quizData: true }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    // Save user message
    await prisma.chat.create({
      data: {
        role: 'USER',
        content: message,
        userId: req.userId!,
        campaignId: campaign?.id
      }
    });

    // Build context: fetch quiz data from campaign if available
    let aiContext = context || {};
    if (campaign?.quizData) {
      aiContext = { ...aiContext, quizData: campaign.quizData, campaignName: campaign.name };
    }

    // Call AI service with timeout and graceful fallback
    let aiText = '';
    let usedFallback = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: aiContext }),
        signal: controller.signal
      });

      if (!aiResponse.ok) {
        throw new Error(`AI service error (${aiResponse.status})`);
      }

      const aiData = await aiResponse.json() as Partial<{ response: string }>;
      if (typeof aiData.response !== 'string' || !aiData.response.trim()) {
        throw new Error('AI service returned empty response');
      }

      aiText = aiData.response.trim();
    } catch (aiError) {
      usedFallback = true;
      console.error('AI upstream error:', aiError);
      aiText = buildAiFallbackResponse(message);
    } finally {
      clearTimeout(timeoutId);
    }

    // Save AI response
    const savedResponse = await prisma.chat.create({
      data: {
        role: 'ASSISTANT',
        content: aiText,
        userId: req.userId!,
        campaignId: campaign?.id
      }
    });

    res.json({
      success: true,
      data: {
        id: savedResponse.id,
        role: 'ASSISTANT',
        content: aiText,
        createdAt: savedResponse.createdAt,
        fallback: usedFallback
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
