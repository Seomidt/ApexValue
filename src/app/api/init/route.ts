// Auto-init endpoint: GET /api/init
// Called from the login page on first load to ensure DB + demo data is ready.
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/init-db';
import { db } from '@/lib/db';
import { organizations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

let done = false;

export async function GET() {
  if (done) return NextResponse.json({ ok: true, cached: true });

  try {
    await initDB();

    // Check if demo org exists
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.id, 'demo-org-001'),
    }).catch(() => null);

    if (!existing) {
      const seed = await import('@/lib/seed');
      await seed.default();
    }

    done = true;
    return NextResponse.json({ ok: true, seeded: !existing });
  } catch (err) {
    console.error('Init error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
