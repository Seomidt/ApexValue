import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionWithUser } from '@/lib/auth';
import { getConnector } from '@/lib/connectors';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const saveSchema = z.object({
  apiKey: z.string().min(1).max(500),
  apiSecret: z.string().optional(),
});

// Test connection
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'test';

    if (action === 'test') {
      const connector = getConnector(params.id);
      if (!connector) return NextResponse.json({ error: 'Unknown connector' }, { status: 404 });

      connector.init({ apiKey: body.apiKey || 'stub' });
      const result = await connector.testConnection();

      // Update last test
      await db.update(integrations)
        .set({
          lastTestAt: new Date().toISOString(),
          lastTestOk: result.ok ? true : false,
          lastTestMessage: result.message,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(integrations.orgId, ctx.org.id), eq(integrations.provider, params.id)));

      return NextResponse.json(result);
    }

    if (action === 'save') {
      const { apiKey } = saveSchema.parse(body);
      const masked = apiKey.slice(-4).padStart(apiKey.length, '•');

      const existing = await db.query.integrations.findFirst({
        where: and(eq(integrations.orgId, ctx.org.id), eq(integrations.provider, params.id)),
      });

      if (existing) {
        await db.update(integrations)
          .set({ encryptedKey: apiKey, keyMasked: masked, isEnabled: true, updatedAt: new Date().toISOString() })
          .where(eq(integrations.id, existing.id));
      } else {
        await db.insert(integrations).values({
          id: nanoid(),
          orgId: ctx.org.id,
          provider: params.id,
          encryptedKey: apiKey, // TODO: encrypt at field level in production
          keyMasked: masked,
          isEnabled: true,
        });
      }

      return NextResponse.json({ ok: true, masked });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db.update(integrations)
      .set({ encryptedKey: null, encryptedSecret: null, isEnabled: false, keyMasked: null })
      .where(and(eq(integrations.orgId, ctx.org.id), eq(integrations.provider, params.id)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
