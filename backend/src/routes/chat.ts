import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

router.use(authMiddleware);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai_service:8000';

// Send message to AI
router.post('/message', async (req: AuthRequest, res) => {
  try {
    const { message, campaignId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Save user message
    await prisma.chat.create({
      data: {
        role: 'USER',
        content: message,
        userId: req.userId!,
        campaignId
      }
    });

    // Build context: fetch quiz data from campaign if available
    let aiContext = context || {};
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, userId: req.userId }
      });
      if (campaign?.quizData) {
        aiContext = { ...aiContext, quizData: campaign.quizData, campaignName: campaign.name };
      }
    }

    // Call AI service
    const aiResponse = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context: aiContext })
    });

    if (!aiResponse.ok) {
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json() as { response: string };

    // Save AI response
    const savedResponse = await prisma.chat.create({
      data: {
        role: 'ASSISTANT',
        content: aiData.response,
        userId: req.userId!,
        campaignId
      }
    });

    res.json({
      success: true,
      data: {
        id: savedResponse.id,
        role: 'ASSISTANT',
        content: aiData.response,
        createdAt: savedResponse.createdAt
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get chat history
router.get('/history', async (req: AuthRequest, res) => {
  try {
    const { campaignId } = req.query;

    const chats = await prisma.chat.findMany({
      where: {
        userId: req.userId,
        ...(campaignId ? { campaignId: campaignId as string } : {})
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Clear chat history
router.delete('/history', async (req: AuthRequest, res) => {
  try {
    const { campaignId } = req.query;

    await prisma.chat.deleteMany({
      where: {
        userId: req.userId,
        ...(campaignId ? { campaignId: campaignId as string } : {})
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export default router;
