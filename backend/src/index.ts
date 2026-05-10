import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import campaignRoutes from './routes/campaign';
import chatRoutes from './routes/chat';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true
}));
app.use(express.json());

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

// Backfill legacy chat rows that lack pane classification.
// Strategy/Content split was previously inferred from content prefixes; we set the
// proper pane field for older data on first boot after the schema migration.
async function backfillChatPanes(): Promise<void> {
  try {
    const contentResult = await prisma.$executeRawUnsafe(
      `UPDATE "Chat" SET "pane" = 'CONTENT'::"ChatPane"
       WHERE ("content" LIKE '[Content Assistant%' OR "content" LIKE '[Content Prompt]%')
         AND "pane" = 'STRATEGY'::"ChatPane"`
    );

    if (typeof contentResult === 'number' && contentResult > 0) {
      console.log(`[backfill] Reclassified ${contentResult} legacy chat row(s) as CONTENT pane.`);
    }
  } catch (err) {
    console.warn('[backfill] Skipped Chat pane backfill:', err);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`AdVisor API running on port ${PORT}`);
  await backfillChatPanes();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
