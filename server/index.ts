import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDatabase } from './config/db';
import { seedDemoAccount, DEMO_CREDENTIALS } from './seed/demoSeed';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5001;

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
