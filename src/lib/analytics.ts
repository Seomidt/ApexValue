import { db } from './db';
import { analyticsEvents, onlineHeartbeats } from './schema';
import { nanoid } from 'nanoid';
import { gt, gte, desc, sql, eq } from 'drizzle-orm';

export type AnalyticsEvent =
  | 'page_view' | 'signup' | 'login' | 'vehicle_created' | 'auction_imported'
  | 'comps_fetched' | 'tax_calculated' | 'pdf_generated' | 'max_bid_calculated'
  | 'status_changed' | 'file_uploaded' | 'heartbeat' | 'logout';

export async function trackEvent(params: {
  event: AnalyticsEvent;
  orgId?: string;
  userId?: string;
  sessionId?: string;
  page?: string;
  country?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(analyticsEvents).values({
      id: nanoid(),
      event: params.event,
      orgId: params.orgId,
      userId: params.userId,
      sessionId: params.sessionId,
      page: params.page,
      country: params.country,
      userAgent: params.userAgent,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    });
  } catch {
    // Non-critical – never fail the main flow
  }
}

export async function updateHeartbeat(params: {
  userId: string;
  orgId?: string;
  country?: string;
  page?: string;
}) {
  try {
    const existing = await db.query.onlineHeartbeats.findFirst({
      where: eq(onlineHeartbeats.userId, params.userId),
    });
    if (existing) {
      await db.update(onlineHeartbeats)
        .set({ lastSeen: new Date().toISOString(), page: params.page, country: params.country })
        .where(eq(onlineHeartbeats.userId, params.userId));
    } else {
      await db.insert(onlineHeartbeats).values({
        id: nanoid(),
        userId: params.userId,
        orgId: params.orgId,
        country: params.country,
        page: params.page,
        lastSeen: new Date().toISOString(),
      });
    }
  } catch {
    // Non-critical
  }
}

export async function getOnlineNow() {
  const cutoff = new Date(Date.now() - 60000).toISOString(); // 60s window
  const rows = await db.select().from(onlineHeartbeats)
    .where(gte(onlineHeartbeats.lastSeen, cutoff));
  return rows;
}

export async function getDashboardStats(days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const rows = await db.select({
    event: analyticsEvents.event,
    country: analyticsEvents.country,
    count: sql<number>`count(*)`,
    date: sql<string>`date(${analyticsEvents.createdAt})`,
  })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(analyticsEvents.event, analyticsEvents.country, sql`date(${analyticsEvents.createdAt})`)
    .orderBy(desc(analyticsEvents.createdAt));
  return rows;
}
