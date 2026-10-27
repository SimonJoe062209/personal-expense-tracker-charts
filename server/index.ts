import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import { seedDemoAccount, DEMO_CREDENTIALS } from './seed/demoSeed';
import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import budgetRoutes from './routes/budgetRoutes';
import settingsRoutes from './routes/settingsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - allow all origins for seamless development and mobile phone access
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

// Boot server
const startServer = async () => {
  try {
    await connectDatabase();
    await seedDemoAccount();

    app.listen(PORT, () => {
      console.log(`
==============================================================
  🚀 MONETA MongoDB API Backend Server Running!
  ➜ Local API:   http://localhost:${PORT}/api
  ➜ Health Check: http://localhost:${PORT}/api/health
  ➜ Demo Account: ${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password}
==============================================================
      `);
    });
  } catch (err) {
    console.error('Failed to start MONETA backend server:', err);
    process.exit(1);
  }
};

startServer();

export default app;
