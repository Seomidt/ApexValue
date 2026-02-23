// ─── App Startup ──────────────────────────────────────────────────────────────
// Called once when the server starts. Initializes DB and seeds demo data.
import { initDB } from './init-db';

let started = false;

export async function ensureStarted() {
  if (started) return;
  started = true;
  try {
    await initDB();
    if (process.env.SEED_DEMO === 'true' && process.env.NODE_ENV !== 'production') {
      const { db } = await import('./db');
      const { organizations } = await import('./schema');
      const { eq } = await import('drizzle-orm');
      const existing = await db.query.organizations.findFirst({
        where: eq(organizations.id, 'demo-org-001'),
      });
      if (!existing) {
        console.log('Seeding demo data...');
        const { default: runSeed } = await import('./seed');
        if (typeof runSeed === 'function') await runSeed();
      }
    }
  } catch (err) {
    console.error('Startup error:', err);
  }
}
