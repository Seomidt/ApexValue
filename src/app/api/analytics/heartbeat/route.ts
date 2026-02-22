import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithUser } from '@/lib/auth';
import { updateHeartbeat } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const country = req.headers.get('cf-ipcountry') ?? body.country ?? 'XX';

    await updateHeartbeat({
      userId: ctx.user.id,
      orgId: ctx.org.id,
      country,
      page: body.page,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
