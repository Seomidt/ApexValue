import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'apexvalue-dev-secret-32-chars-ok'
);

const PUBLIC_PATHS = ['/', '/login', '/signup', '/reset-password', '/api/auth/login', '/api/auth/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/api/auth/'))) {
    return NextResponse.next();
  }

  // Static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get('apex_session')?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    // Attach user info to headers for downstream
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', (payload.userId as string) || '');
    requestHeaders.set('x-org-id', (payload.orgId as string) || '');
    requestHeaders.set('x-user-role', (payload.role as string) || '');
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
