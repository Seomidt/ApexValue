import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vehicles, profitScenarios, taxRecords } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getSessionWithUser } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 50);

    const [vList, scenarios] = await Promise.all([
      db.select().from(vehicles)
        .where(eq(vehicles.orgId, ctx.org.id))
        .orderBy(desc(vehicles.createdAt))
        .limit(limit),
      db.select().from(profitScenarios)
        .where(eq(profitScenarios.orgId, ctx.org.id)),
    ]);

    const scenarioMap = new Map(scenarios.map((s) => [s.vehicleId, s]));

    const result = vList.map((v) => {
      const sc = scenarioMap.get(v.id);
      return {
        ...v,
        scenario: sc ? {
          normalProfitEur: sc.normalProfitEur,
          normalRoi: sc.normalRoi,
          maxBidBalanced: sc.maxBidBalanced,
          totalCostEur: sc.totalCostEur,
        } : undefined,
      };
    });

    return NextResponse.json({ vehicles: result, total: result.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

const createSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  mileageKm: z.number().int().min(0),
  buyPriceEur: z.number().min(0),
  fuelType: z.string().optional(),
  gearbox: z.string().optional(),
  sourceName: z.string().optional(),
  sourceCountry: z.string().optional(),
  variant: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const id = nanoid();
    await db.insert(vehicles).values({
      id,
      orgId: ctx.org.id,
      ...data,
      status: 'found',
      dealScore: 0,
      isDemo: false,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
