import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vehicles, vehicleCosts, marketComps, taxRecords, profitScenarios, pdfReports } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionWithUser } from '@/lib/auth';
import { generatePDFReport } from '@/lib/pdf';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSessionWithUser();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const vehicleId = params.id;

    const [vehicle, costs, comps, taxRecord, scenario] = await Promise.all([
      db.query.vehicles.findFirst({
        where: and(eq(vehicles.id, vehicleId), eq(vehicles.orgId, ctx.org.id)),
      }),
      db.select().from(vehicleCosts).where(eq(vehicleCosts.vehicleId, vehicleId)),
      db.select().from(marketComps).where(eq(marketComps.vehicleId, vehicleId)),
      db.query.taxRecords.findFirst({ where: eq(taxRecords.vehicleId, vehicleId) }),
      db.query.profitScenarios.findFirst({ where: eq(profitScenarios.vehicleId, vehicleId) }),
    ]);

    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });

    const reportId = `AV-${Date.now().toString(36).toUpperCase()}`;

    const pdfBuffer = await generatePDFReport({
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant ?? undefined,
        year: vehicle.year,
        mileageKm: vehicle.mileageKm,
        fuelType: vehicle.fuelType ?? undefined,
        gearbox: vehicle.gearbox ?? undefined,
        vin: vehicle.vin ?? undefined,
        buyPriceEur: vehicle.buyPriceEur ?? 0,
        auctionFeeEur: vehicle.auctionFeeEur ?? 0,
        sourceName: vehicle.sourceName ?? undefined,
        sourceCountry: vehicle.sourceCountry ?? undefined,
        dealScore: vehicle.dealScore ?? 0,
      },
      org: {
        name: ctx.org.name,
        vatId: ctx.org.vatId ?? undefined,
        country: ctx.org.country ?? undefined,
      },
      costs: costs.map((c) => ({
        label: c.label,
        amountEur: c.amountEur,
        included: c.included ?? true,
      })),
      comps: comps.map((c) => ({
        make: c.make,
        model: c.model,
        year: c.year ?? undefined,
        mileageKm: c.mileageKm ?? undefined,
        priceEur: c.priceEur,
        source: c.source ?? undefined,
      })),
      taxRecord: taxRecord ? {
        vatScheme: taxRecord.vatScheme ?? undefined,
        registrationTaxEur: taxRecord.registrationTaxEur ?? undefined,
        isEstimated: taxRecord.isEstimated ?? true,
        capitalBindingIndicator: taxRecord.capitalBindingIndicator ?? undefined,
      } : undefined,
      scenario: scenario ? {
        totalCostEur: scenario.totalCostEur,
        conservativeSellEur: scenario.conservativeSellEur ?? undefined,
        normalSellEur: scenario.normalSellEur ?? undefined,
        optimisticSellEur: scenario.optimisticSellEur ?? undefined,
        conservativeProfitEur: scenario.conservativeProfitEur ?? undefined,
        normalProfitEur: scenario.normalProfitEur ?? undefined,
        optimisticProfitEur: scenario.optimisticProfitEur ?? undefined,
        conservativeRoi: scenario.conservativeRoi ?? undefined,
        normalRoi: scenario.normalRoi ?? undefined,
        optimisticRoi: scenario.optimisticRoi ?? undefined,
        breakEvenEur: scenario.breakEvenEur ?? undefined,
        maxBidSafe: scenario.maxBidSafe ?? undefined,
        maxBidBalanced: scenario.maxBidBalanced ?? undefined,
        maxBidAggressive: scenario.maxBidAggressive ?? undefined,
      } : undefined,
      reportId,
      generatedAt: new Date().toLocaleDateString('en-GB'),
    });

    // Save report metadata
    await db.insert(pdfReports).values({
      id: nanoid(),
      vehicleId,
      orgId: ctx.org.id,
      version: 1,
      sizeBytes: pdfBuffer.length,
      recommendation: (vehicle.dealScore ?? 0) >= 65 ? 'BUY' : (vehicle.dealScore ?? 0) >= 40 ? 'CONSIDER' : 'DROP',
      dealScore: vehicle.dealScore ?? 0,
      generatedBy: ctx.user.id,
    }).catch(() => {}); // Non-blocking

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="apexvalue-report-${reportId}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
