import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (!dbInstance) {
    const useDb = process.env.USE_DATABASE === 'true' || process.env.USE_DATABASE === '1';
    const databaseUrl = process.env.DATABASE_URL;
    if (!useDb || !databaseUrl) {
      throw new Error('Database not enabled. Set USE_DATABASE=true and DATABASE_URL to enable.');
    }
    const sql = neon(databaseUrl);
    dbInstance = drizzle(sql);
  }
  return dbInstance;
};

export const db = (process.env.USE_DATABASE === 'true' || process.env.USE_DATABASE === '1') && process.env.DATABASE_URL
  ? getDb()
  : null;
