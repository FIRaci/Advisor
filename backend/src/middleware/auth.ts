import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from '../lib/firebaseAdmin';
import { prisma } from '../index';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Attempt to verify as Firebase Token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Upsert the user into our database to ensure they exist for relations
      const email = decodedToken.email || `${decodedToken.uid}@firebase.auth`;
      const name = decodedToken.name || 'Firebase User';
      
      const dbUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          id: decodedToken.uid, // Map Firebase UID to our ID
          email,
          name,
          password: 'firebase_auth_no_password' // Dummy password
        }
      });
      
      req.userId = dbUser.id;
      return next();
    } catch (firebaseError) {
      // If it fails, fallback to local JWT (for backward compatibility if needed)
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      return next();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
