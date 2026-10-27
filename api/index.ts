import { createApp } from '../server/app';
import { connectDatabase } from '../server/config/db';
import { seedDemoAccount } from '../server/seed/demoSeed';
import { Request, Response } from 'express';

const app = createApp();

let isInitialized = false;

const initDb = async () => {
  if (!isInitialized) {
    try {
      await connectDatabase();
      await seedDemoAccount();
      isInitialized = true;
    } catch (err) {
      console.error('[Vercel Serverless] Failed to connect to database:', err);
    }
  }
};

export default async function handler(req: Request, res: Response) {
  await initDb();
  return app(req, res);
}
