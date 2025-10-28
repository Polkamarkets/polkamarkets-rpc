import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (!dbInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is required. Please set it.'
      );
    }
    const sql = neon(databaseUrl);
    dbInstance = drizzle(sql);
  }
  return dbInstance;
};

export const db = getDb();
