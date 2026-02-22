// Internal endpoint to initialize DB + seed on first request
// Called via next.config.js or manually
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/init-db';

let initialized = false;

export async function GET() {
  if (!initialized) {
    await initDB();
    initialized = true;
  }
  return NextResponse.json({ ok: true, initialized });
}
export const dynamic = 'force-dynamic';
