import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const ctx = await getSessionWithUser();
  if (!ctx) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      language: ctx.user.language,
      defaultMarket: ctx.user.defaultMarket,
    },
    org: {
      id: ctx.org.id,
      name: ctx.org.name,
      plan: ctx.org.plan,
      isDemo: ctx.org.isDemo,
    },
  });
}
