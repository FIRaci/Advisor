import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

router.use(authMiddleware);

// Get current user
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
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
    const { name } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
      select: { id: true, email: true, name: true, role: true }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
