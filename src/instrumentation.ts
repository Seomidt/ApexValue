// ─── Next.js Instrumentation ──────────────────────────────────────────────────
// Runs once when the server starts. Initializes the database and seeds demo data.
// Supports both local SQLite (DATABASE_URL=file:./apexvalue.db) and Turso cloud.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureStarted } = await import('./lib/startup');
    await ensureStarted();
  }
}
