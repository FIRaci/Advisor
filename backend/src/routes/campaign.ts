import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).optional(),
  quizData: z.any().optional()
});

const updateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(600).nullable().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
    quizData: z.any().optional(),
    strategy: z.any().optional(),
    isFavorite: z.boolean().optional()
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'No valid fields to update'
  });

// Get all campaigns for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.userId },
      orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { chats: true } }
      }
    });

    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        chats: { orderBy: { createdAt: 'asc' } },
        _count: { select: { chats: true } }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create campaign
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createCampaignSchema.parse(req.body);
    
    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        userId: req.userId!
      }
    });

    res.json({ success: true, data: campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = updateCampaignSchema.parse(req.body);

    const campaign = await prisma.campaign.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data
    });

    if (campaign.count === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const updated = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        _count: { select: { chats: true } }
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.campaign.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
