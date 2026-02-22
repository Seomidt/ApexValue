import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vehicles, vehicleCosts, marketComps, taxRecords, profitScenarios, vehicleHistory } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionWithUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [vehicle, costs, comps, taxRecord, scenario, history] = await Promise.all([
      db.query.vehicles.findFirst({
        where: and(eq(vehicles.id, params.id), eq(vehicles.orgId, ctx.org.id)),
      }),
      db.select().from(vehicleCosts).where(eq(vehicleCosts.vehicleId, params.id)),
      db.select().from(marketComps).where(eq(marketComps.vehicleId, params.id)),
      db.query.taxRecords.findFirst({ where: eq(taxRecords.vehicleId, params.id) }),
      db.query.profitScenarios.findFirst({ where: eq(profitScenarios.vehicleId, params.id) }),
      db.select().from(vehicleHistory).where(eq(vehicleHistory.vehicleId, params.id)),
    ]);

    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ vehicle, costs, comps, taxRecord, scenario, history });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const allowed = ['status', 'notes', 'dealScore', 'buyPriceEur', 'mileageKm'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    await db.update(vehicles)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(and(eq(vehicles.id, params.id), eq(vehicles.orgId, ctx.org.id)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
