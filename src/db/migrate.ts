import 'dotenv/config';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

// Standalone migration runner for production (Heroku release phase / one-off dynos),
// where drizzle-kit (a devDependency) is not available. Uses drizzle-orm's runtime
// migrator, which shares the same drizzle.__drizzle_migrations bookkeeping table
// as `drizzle-kit migrate`, so local and production runs stay interchangeable.
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[db:migrate] DATABASE_URL not set; skipping migrations.');
    return;
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  // Resolves to <repo root>/drizzle from both dist/db (compiled) and src/db (ts-node)
  const migrationsFolder = path.join(__dirname, '..', '..', 'drizzle');

  console.log('[db:migrate] Applying pending migrations...');
  await migrate(db, { migrationsFolder });
  console.log('[db:migrate] Migrations up to date.');
}

main().catch((err) => {
  console.error('[db:migrate] Migration failed:', err);
  process.exit(1);
});
