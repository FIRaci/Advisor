import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).optional(),
  quizData: z.record(z.unknown()).optional().refine(val => !val || JSON.stringify(val).length <= 50000, "quizData too large"),
  quizProgress: z.record(z.unknown()).optional().refine(val => !val || JSON.stringify(val).length <= 50000, "quizProgress too large")
});

const updateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(600).nullable().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
    quizData: z.record(z.unknown()).optional().refine(val => !val || JSON.stringify(val).length <= 50000, "quizData too large"),
    quizProgress: z.record(z.unknown()).optional().refine(val => !val || JSON.stringify(val).length <= 50000, "quizProgress too large"),
    strategy: z.record(z.unknown()).optional().refine(val => !val || JSON.stringify(val).length <= 200000, "strategy too large"),
    isFavorite: z.boolean().optional()
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'No valid fields to update'
  });

const updateQuizProgressSchema = z.object({
  stageIndex: z.number().int().min(0),
  stageLabel: z.string().trim().min(1).max(80).optional(),
  totalStages: z.number().int().min(1).max(10).optional(),
  answers: z.record(z.string()).optional(),
  completed: z.boolean().optional()
});

const metricsSnapshotSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  label: z.string().trim().max(120).optional(),
  metrics: z.record(z.any())
}).refine((payload) => {
  const start = new Date(payload.periodStart);
  const end = new Date(payload.periodEnd);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
}, {
  message: 'periodStart must be a valid date and before periodEnd'
});

const metricsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(12)
});

const getCampaignsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

// Get all campaigns for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const parseRes = getCampaignsQuerySchema.safeParse(req.query);
    if (!parseRes.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: parseRes.error.errors });
    }
    const { limit, offset } = parseRes.data;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: { userId: req.userId },
        orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { chats: true } }
        },
        take: limit,
        skip: offset
      }),
      prisma.campaign.count({ where: { userId: req.userId } })
    ]);

    res.json({ success: true, data: campaigns, metadata: { total, limit, offset } });
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

// Update quiz progress + stage answers
router.patch('/:id/quiz-progress', async (req: AuthRequest, res) => {
  try {
    const payload = updateQuizProgressSchema.parse(req.body);

    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: { id: true, quizData: true, quizProgress: true }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const mergedQuizData = {
      ...(campaign.quizData && typeof campaign.quizData === 'object' ? campaign.quizData : {}),
      ...(payload.answers || {})
    } as Record<string, string>;

    const previousProgress = (campaign.quizProgress && typeof campaign.quizProgress === 'object')
      ? campaign.quizProgress as Record<string, unknown>
      : {};
    const previousTotalStages = typeof previousProgress.totalStages === 'number'
      ? previousProgress.totalStages
      : undefined;

    const nowIso = new Date().toISOString();
    const completedStages = new Set(
      Array.isArray(previousProgress.completedStages) ? previousProgress.completedStages as number[] : []
    );

    if (payload.completed) {
      completedStages.add(payload.stageIndex);
    }

    const stageSnapshots = Array.isArray(previousProgress.stageSnapshots)
      ? [...(previousProgress.stageSnapshots as Array<Record<string, unknown>>)]
      : [];

    if (payload.completed && payload.answers) {
      const existingIndex = stageSnapshots.findIndex(
        (snapshot) => snapshot.stageIndex === payload.stageIndex
      );
      const nextSnapshot = {
        stageIndex: payload.stageIndex,
        stageLabel: payload.stageLabel,
        completedAt: nowIso,
        answers: payload.answers
      };

      if (existingIndex >= 0) {
        stageSnapshots[existingIndex] = nextSnapshot;
      } else {
        stageSnapshots.push(nextSnapshot);
      }
    }

    const nextProgress = {
      ...previousProgress,
      currentStage: payload.completed ? payload.stageIndex + 1 : payload.stageIndex,
      totalStages: payload.totalStages ?? previousTotalStages,
      completedStages: Array.from(completedStages).sort(),
      lastUpdated: nowIso,
      stageSnapshots
    };

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        quizData: mergedQuizData,
        quizProgress: nextProgress as Prisma.InputJsonValue
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: 'Failed to update quiz progress' });
  }
});

// Create metrics snapshot
router.post('/:id/metrics', async (req: AuthRequest, res) => {
  try {
    const payload = metricsSnapshotSchema.parse(req.body);

    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: { id: true }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const snapshot = await prisma.campaignMetricsSnapshot.create({
      data: {
        campaignId: campaign.id,
        periodStart: new Date(payload.periodStart),
        periodEnd: new Date(payload.periodEnd),
        label: payload.label,
        metrics: payload.metrics
      }
    });

    res.json({ success: true, data: snapshot });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: 'Failed to create metrics snapshot' });
  }
});

// List metrics snapshots
router.get('/:id/metrics', async (req: AuthRequest, res) => {
  try {
    const { limit } = metricsQuerySchema.parse(req.query);

    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: { id: true }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const snapshots = await prisma.campaignMetricsSnapshot.findMany({
      where: { campaignId: campaign.id },
      orderBy: { periodEnd: 'desc' },
      take: limit
    });

    res.json({ success: true, data: snapshots });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: 'Failed to fetch metrics snapshots' });
  }
});

// Delete campaign
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.campaign.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
