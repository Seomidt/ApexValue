import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations, users } from '@/lib/schema';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  orgName: z.string().min(2).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Check email exists
    const existing = await db.query.users.findFirst({ where: eq(users.email, data.email) });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const orgId = nanoid();
    const userId = nanoid();
    const slug = data.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + nanoid(4);

    await db.insert(organizations).values({
      id: orgId,
      name: data.orgName,
      slug,
      plan: 'free',
      isActive: true,
      isDemo: false,
    });

    const passwordHash = await hashPassword(data.password);
    await db.insert(users).values({
      id: userId,
      orgId,
      email: data.email,
      passwordHash,
      name: data.name,
      role: 'orgadmin',
      isActive: true,
    });

    const token = await createSessionToken({ userId, orgId, role: 'orgadmin', sessionId: nanoid() });

    await trackEvent({ event: 'signup', orgId, userId }).catch(() => {});

    const response = NextResponse.json({ ok: true });
    response.cookies.set('apex_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
