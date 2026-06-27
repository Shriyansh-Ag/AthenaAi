import express, { Express } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { generalLimiter } from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';
import { logger } from './utils/logger';

const app: Express = express();

// ── Security Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Rate Limiting ────────────────────────────────────────────────────────
app.use(generalLimiter);

// ── Trust Proxy (for rate limiting behind reverse proxy) ─────────────────
app.set('trust proxy', 1);

// ── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Error Handler (must be last) ─────────────────────────────────────────
app.use(errorHandler);

// ── Server Startup ───────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`Connected to MongoDB at ${env.MONGODB_URI}`);

    app.listen(env.PORT, () => {
      logger.info(`Auth service running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

bootstrap();

export { app };
