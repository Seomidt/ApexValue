import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db, ensureDB } from './db';
import { users, sessions, organizations } from './schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'apexvalue-dev-secret-32-chars-ok'
);
const COOKIE = 'apex_session';
const SESSION_TTL_DAYS = 30;

// ─── Password Hashing ─────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT / Session ────────────────────────────────────────────────────────────
export interface SessionPayload {
  userId: string;
  orgId: string;
  role: string;
  sessionId: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getSessionWithUser() {
  const session = await getSession();
  if (!session) return null;

  await ensureDB();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!user || !user.isActive) return null;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.orgId),
  });
  if (!org || !org.isActive) return null;

  return { session, user, org };
}

export function setSessionCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
    path: '/',
  });
}

export function clearSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE, '', { maxAge: 0, path: '/' });
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  await ensureDB();

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
  if (!user || !user.isActive) return { error: 'Invalid credentials' };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: 'Invalid credentials' };

  const sessionId = nanoid();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400000).toISOString();

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  const payload: SessionPayload = {
    userId: user.id,
    orgId: user.orgId,
    role: user.role ?? 'user',
    sessionId,
  };

  const token = await createSessionToken(payload);
  return { token, user, payload };
}

// ─── Auth Guard Helpers ───────────────────────────────────────────────────────
export function requireRole(userRole: string, minRole: string): boolean {
  const order = ['viewer', 'user', 'orgadmin', 'superadmin'];
  return order.indexOf(userRole) >= order.indexOf(minRole);
}

export function isSuperAdmin(role: string): boolean {
  return role === 'superadmin';
}
