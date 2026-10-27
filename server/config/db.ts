import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<string> => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[DB] Attempting connection to configured MONGODB_URI...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[DB] Successfully connected to external MongoDB database!`);
      return uri;
    } catch (err: any) {
      console.warn(`[DB] Failed to connect to external MONGODB_URI (${err.message}). Falling back to embedded MongoDB...`);
    }
  }

  // Fallback to Embedded MongoMemoryServer for 100% zero-configuration local demo
  try {
    console.log(`[DB] Starting embedded MongoDB server (zero-setup mode)...`);
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[DB] Connected to embedded in-memory MongoDB: ${memoryUri}`);
    return memoryUri;
  } catch (err: any) {
    console.error(`[DB] Failed to initialize embedded MongoDB:`, err);
    throw err;
  }
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};
