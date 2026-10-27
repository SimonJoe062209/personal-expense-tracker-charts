import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import budgetRoutes from './routes/budgetRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { DEMO_CREDENTIALS } from './seed/demoSeed';

export const createApp = () => {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));

  // Request logger
  app.use((req, _res, next) => {
    if (req.path !== '/api/health') {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      demoAccount: {
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password,
      },
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/settings', settingsRoutes);

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
};
