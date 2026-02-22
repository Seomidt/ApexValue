import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithUser } from '@/lib/auth';
import { getOnlineNow, getDashboardStats } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [online, stats] = await Promise.all([
      getOnlineNow(),
      getDashboardStats(30),
    ]);

    return NextResponse.json({ online, stats });
  } catch {
    return NextResponse.json({ online: [], stats: [] });
  }
}
export const dynamic = 'force-dynamic';
