import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(180).optional(),
    avatar: z.string().optional()
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'No valid fields to update'
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128)
  })
  .strict()
  .refine((payload) => payload.currentPassword !== payload.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword']
  });

// Get current user
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.patch('/me', async (req: AuthRequest, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, email: true, name: true, role: true, avatar: true }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already in use' });
    }

    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Change password
router.patch('/me/password', async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, password: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
