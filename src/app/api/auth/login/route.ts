import { NextRequest, NextResponse } from 'next/server';
import { loginUser, setSessionCookie } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);

    const result = await loginUser(email, password);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, user: { id: result.user.id, name: result.user.name, role: result.user.role } });
    response.cookies.set('apex_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    await trackEvent({
      event: 'login',
      orgId: result.user.orgId,
      userId: result.user.id,
      country: req.headers.get('cf-ipcountry') ?? req.headers.get('x-country') ?? undefined,
    }).catch(() => {});

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
