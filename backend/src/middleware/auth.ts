import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = req.cookies?.advisor_token;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Simple CSRF protection for state-changing requests
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    const origin = req.headers.origin || req.headers.referer;
    if (!origin) {
      // Allow API clients like curl/postman if they use Bearer token instead of cookie
      if (!req.headers.authorization?.startsWith('Bearer ')) {
         return res.status(403).json({ error: 'Missing Origin/Referer header' });
      }
    }
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET environment variable is missing!');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; version?: number };
    
    // DB Check to prevent Zombie JWTs (ensure user still exists)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.tokenVersion !== decoded.version) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    req.userId = decoded.userId;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
