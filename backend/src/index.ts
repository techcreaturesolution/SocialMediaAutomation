import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { schedulerService } from './services/SchedulerService';

import authRoutes from './routes/authRoutes';
import contentRoutes from './routes/contentRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/schedules', scheduleRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Social Media Automation AI Agent',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    message: 'AI-Powered Social Media Content Automation Agent',
    version: '1.0.0',
    company: config.company.name,
    docs: '/api/health',
  });
});

const start = async () => {
  await connectDatabase();
  schedulerService.start();

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Company: ${config.company.name}`);
  });
};

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
