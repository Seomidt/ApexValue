import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.redirect(new URL('/login', process.env.APP_BASE_URL || 'http://localhost:3000'));
  response.cookies.set('apex_session', '', { maxAge: 0, path: '/' });
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.APP_BASE_URL || 'http://localhost:3000'));
  response.cookies.set('apex_session', '', { maxAge: 0, path: '/' });
  return response;
}
