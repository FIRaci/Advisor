import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import campaignRoutes from './routes/campaign';
import chatRoutes from './routes/chat';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [FRONTEND_URL, 'http://localhost:3000', 'https://advisorai-eight.vercel.app'];
    
    // In test environment or same-origin requests, origin may be undefined
    if (!origin && process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }
    
    // Allow strict origins or any Vercel preview deployment
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/chat', chatRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`AdVisor API running on port ${PORT}`);
  });
}

// Graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { app, prisma };
