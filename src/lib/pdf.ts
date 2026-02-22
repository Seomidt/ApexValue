// ─── PDF Report Generator ─────────────────────────────────────────────────────
// Uses jsPDF (pure JS, works in Node/StackBlitz/Vercel).
// Generates dealer-grade investment reports with Gulf Racing styling.

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmt, fmtPct, calcCompStats } from './calculations';

// Colors
const DARK_BLUE = '#002776';
const ORANGE = '#FF6319';
const POWDER = '#B9D9EB';
const LIGHT_BG = '#F0F6FA';
const WHITE = '#FFFFFF';
const DARK_TEXT = '#0A1628';
const GRAY = '#64748B';

function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function setFill(doc: jsPDF, hex: string) {
  doc.setFillColor(...hexToRGB(hex));
}

function setTextColor(doc: jsPDF, hex: string) {
  doc.setTextColor(...hexToRGB(hex));
}

function setDrawColor(doc: jsPDF, hex: string) {
  doc.setDrawColor(...hexToRGB(hex));
}

interface ReportData {
  vehicle: {
    id: string; make: string; model: string; variant?: string; year: number;
    mileageKm: number; fuelType?: string; gearbox?: string; vin?: string;
    buyPriceEur: number; auctionFeeEur?: number; sourceName?: string;
    sourceCountry?: string; dealScore?: number;
  };
  org: { name: string; vatId?: string; country?: string };
  costs: Array<{ label: string; amountEur: number; included: boolean }>;
  comps: Array<{ make: string; model: string; year?: number; mileageKm?: number; priceEur: number; source?: string }>;
  taxRecord?: {
    vatScheme?: string; registrationTaxEur?: number; isEstimated?: boolean;
    vatAmountEur?: number; capitalBindingIndicator?: string;
  };
  scenario?: {
    totalCostEur: number; conservativeSellEur?: number; normalSellEur?: number;
    optimisticSellEur?: number; conservativeProfitEur?: number; normalProfitEur?: number;
    optimisticProfitEur?: number; conservativeRoi?: number; normalRoi?: number;
    optimisticRoi?: number; breakEvenEur?: number; maxBidSafe?: number;
    maxBidBalanced?: number; maxBidAggressive?: number;
  };
  reportId?: string;
  generatedAt?: string;
}

export async function generatePDFReport(data: ReportData): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { vehicle, org, costs, comps, taxRecord, scenario } = data;

  const reportId = data.reportId || `AV-${Date.now()}`;
  const genDate = data.generatedAt || new Date().toLocaleDateString('en-GB');
  const rec = (vehicle.dealScore ?? 0) >= 65 ? 'BUY' : (vehicle.dealScore ?? 0) >= 40 ? 'CONSIDER' : 'DROP';
  const recColor = rec === 'BUY' ? '#10b981' : rec === 'CONSIDER' ? '#f59e0b' : '#ef4444';

  const W = 210;
  const M = 15; // margin
  let y = 0;

  // ── PAGE 1: Cover ────────────────────────────────────────────────────────────
  // Dark blue header bar
  setFill(doc, DARK_BLUE);
  doc.rect(0, 0, W, 55, 'F');

  // Orange accent stripe
  setFill(doc, ORANGE);
  doc.rect(0, 55, W, 3, 'F');

  // Powder stripe
  setFill(doc, POWDER);
  doc.rect(0, 58, W, 1, 'F');

  // Logo area (text-based since no image)
  setTextColor(doc, ORANGE);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ApexValue', M, 20);

  setTextColor(doc, POWDER);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Dealer Investment Report', M, 27);

  // Report meta (top right)
  setTextColor(doc, POWDER);
  doc.setFontSize(8);
  doc.text(`Report: ${reportId}`, W - M, 20, { align: 'right' });
  doc.text(`Date: ${genDate}`, W - M, 26, { align: 'right' });
  doc.text(`Org: ${org.name}`, W - M, 32, { align: 'right' });

  // Vehicle headline
  setTextColor(doc, WHITE);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, M, 45);

  setTextColor(doc, POWDER);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${vehicle.variant ?? ''} · ${vehicle.mileageKm.toLocaleString()} km · ${vehicle.fuelType ?? ''} · ${vehicle.gearbox ?? ''}`, M, 51);

  y = 72;

  // Recommendation badge
  setFill(doc, hexToRGB(recColor).join(',') as any);
  doc.setFillColor(...hexToRGB(recColor));
  doc.roundedRect(M, y, 40, 12, 2, 2, 'F');
  setTextColor(doc, WHITE);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(rec, M + 20, y + 8, { align: 'center' });

  // Deal score
  setTextColor(doc, DARK_TEXT);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Deal Score: ${vehicle.dealScore ?? 0}/100`, M + 48, y + 8);

  y += 20;

  // Vehicle summary box
  setFill(doc, LIGHT_BG);
  doc.rect(M, y, W - M * 2, 35, 'F');
  setDrawColor(doc, POWDER);
  doc.setLineWidth(0.3);
  doc.rect(M, y, W - M * 2, 35);

  const col1 = M + 5;
  const col2 = M + 60;
  const col3 = M + 115;

  setTextColor(doc, GRAY);
  doc.setFontSize(7);
  const infoRows = [
    ['Make', vehicle.make, 'Source', vehicle.sourceName || '–', 'Buy price', fmt(vehicle.buyPriceEur)],
    ['Model', vehicle.model, 'Country', vehicle.sourceCountry || '–', 'Auction fee', fmt(vehicle.auctionFeeEur ?? 0)],
    ['Year', String(vehicle.year), 'VIN', vehicle.vin || '–', 'Target market', 'DK'],
    ['Mileage', `${vehicle.mileageKm.toLocaleString()} km`, 'Fuel', vehicle.fuelType || '–', 'Total cost', fmt(scenario?.totalCostEur ?? 0)],
  ];

  infoRows.forEach((row, i) => {
    const rowY = y + 7 + i * 7;
    setTextColor(doc, GRAY);
    doc.setFontSize(7);
    doc.text(row[0], col1, rowY);
    setTextColor(doc, DARK_TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(row[1], col1 + 18, rowY);
    doc.setFont('helvetica', 'normal');

    setTextColor(doc, GRAY);
    doc.text(row[2], col2, rowY);
    setTextColor(doc, DARK_TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(row[3], col2 + 22, rowY);
    doc.setFont('helvetica', 'normal');

    setTextColor(doc, GRAY);
    doc.text(row[4], col3, rowY);
    setTextColor(doc, DARK_TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(row[5], col3 + 22, rowY);
    doc.setFont('helvetica', 'normal');
  });

  y += 45;

  // ── Section: Market Analysis ──────────────────────────────────────────────
  addSectionHeader(doc, 'Market Analysis', M, y);
  y += 10;

  const compPrices = comps.map((c) => c.priceEur);
  const stats = calcCompStats(compPrices);

  if (stats.count > 0) {
    // Stats grid
    const statCols = [
      ['Comps found', String(stats.count)],
      ['Median price', fmt(stats.median)],
      ['P25 (low)', fmt(stats.p25)],
      ['P75 (high)', fmt(stats.p75)],
      ['Range', `${fmt(stats.min)} – ${fmt(stats.max)}`],
      ['Std. deviation', fmt(stats.stdDev)],
    ];

    statCols.forEach((col, i) => {
      const bx = M + (i % 3) * 60;
      const by = y + Math.floor(i / 3) * 14;
      setFill(doc, LIGHT_BG);
      doc.rect(bx, by, 55, 11, 'F');
      setTextColor(doc, GRAY);
      doc.setFontSize(7);
      doc.text(col[0], bx + 3, by + 5);
      setTextColor(doc, DARK_TEXT);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(col[1], bx + 3, by + 9.5);
      doc.setFont('helvetica', 'normal');
    });
    y += 32;
  }

  // Comps table (top 10)
  if (comps.length > 0) {
    const tableData = comps.slice(0, 10).map((c) => [
      `${c.make} ${c.model}`,
      String(c.year ?? '–'),
      c.mileageKm ? `${c.mileageKm.toLocaleString()} km` : '–',
      fmt(c.priceEur),
      c.source || '–',
    ]);

    autoTable(doc, {
      head: [['Vehicle', 'Year', 'Mileage', 'Price', 'Source']],
      body: tableData,
      startY: y,
      margin: { left: M, right: M },
      headStyles: { fillColor: hexToRGB(DARK_BLUE), textColor: hexToRGB(WHITE), fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: hexToRGB(DARK_TEXT) },
      alternateRowStyles: { fillColor: hexToRGB(LIGHT_BG) },
      tableLineColor: hexToRGB(POWDER),
      tableLineWidth: 0.1,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── PAGE 2: Financial Sheet ───────────────────────────────────────────────
  doc.addPage();
  addPageHeader(doc, 'Financial Analysis', org.name, reportId);
  y = 35;

  // ── Tax & VAT ─────────────────────────────────────────────────────────────
  addSectionHeader(doc, 'Tax & VAT', M, y);
  y += 10;

  if (taxRecord) {
    const vatRows = [
      ['VAT scheme', taxRecord.vatScheme || '–'],
      ['Registration tax (EUR)', fmt(taxRecord.registrationTaxEur ?? 0)],
      ['Source', taxRecord.isEstimated ? '⚠️ Estimated (not official)' : 'Official calculation'],
      ['Capital binding', taxRecord.capitalBindingIndicator || '–'],
    ];

    autoTable(doc, {
      body: vatRows,
      startY: y,
      margin: { left: M, right: M },
      bodyStyles: { fontSize: 8, textColor: hexToRGB(DARK_TEXT) },
      alternateRowStyles: { fillColor: hexToRGB(LIGHT_BG) },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold', textColor: hexToRGB(GRAY) } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Cost Breakdown ────────────────────────────────────────────────────────
  addSectionHeader(doc, 'Cost Breakdown', M, y);
  y += 10;

  const costRows = [
    ['Buy price', fmt(vehicle.buyPriceEur)],
    ['Auction fee', fmt(vehicle.auctionFeeEur ?? 0)],
    ...costs.filter((c) => c.included).map((c) => [c.label, fmt(c.amountEur)]),
  ];

  autoTable(doc, {
    head: [['Item', 'Amount (EUR)']],
    body: costRows,
    startY: y,
    margin: { left: M, right: M },
    headStyles: { fillColor: hexToRGB(DARK_BLUE), textColor: hexToRGB(WHITE), fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: hexToRGB(LIGHT_BG) },
  });

  y = (doc as any).lastAutoTable.finalY;

  // Total cost row
  setFill(doc, DARK_BLUE);
  doc.rect(M, y, W - M * 2, 8, 'F');
  setTextColor(doc, WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL COST', M + 3, y + 5.5);
  doc.text(fmt(scenario?.totalCostEur ?? 0), W - M - 3, y + 5.5, { align: 'right' });
  y += 15;

  // ── Profit Scenarios ──────────────────────────────────────────────────────
  if (scenario) {
    addSectionHeader(doc, 'Profit Scenarios', M, y);
    y += 10;

    autoTable(doc, {
      head: [['Scenario', 'Sell Price', 'Profit', 'ROI', 'Rating']],
      body: [
        ['Conservative', fmt(scenario.conservativeSellEur ?? 0), fmt(scenario.conservativeProfitEur ?? 0), fmtPct(scenario.conservativeRoi ?? 0), 'Worst case'],
        ['Normal', fmt(scenario.normalSellEur ?? 0), fmt(scenario.normalProfitEur ?? 0), fmtPct(scenario.normalRoi ?? 0), 'Expected'],
        ['Optimistic', fmt(scenario.optimisticSellEur ?? 0), fmt(scenario.optimisticProfitEur ?? 0), fmtPct(scenario.optimisticRoi ?? 0), 'Best case'],
      ],
      startY: y,
      margin: { left: M, right: M },
      headStyles: { fillColor: hexToRGB(DARK_BLUE), textColor: hexToRGB(WHITE), fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: hexToRGB(LIGHT_BG) },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Max bid + break-even
    const summaryRows = [
      ['Break-even price', fmt(scenario.breakEvenEur ?? 0)],
      ['Max bid – Safe', fmt(scenario.maxBidSafe ?? 0)],
      ['Max bid – Balanced', fmt(scenario.maxBidBalanced ?? 0)],
      ['Max bid – Aggressive', fmt(scenario.maxBidAggressive ?? 0)],
    ];

    autoTable(doc, {
      body: summaryRows,
      startY: y,
      margin: { left: M, right: M },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: hexToRGB(LIGHT_BG) },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold', textColor: hexToRGB(GRAY) } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── PAGE 3: Conclusion ───────────────────────────────────────────────────
  doc.addPage();
  addPageHeader(doc, 'Conclusion & Recommendation', org.name, reportId);
  y = 35;

  // Big recommendation
  setFill(doc, hexToRGB(recColor) as any);
  doc.setFillColor(...hexToRGB(recColor));
  doc.roundedRect(M, y, W - M * 2, 18, 3, 3, 'F');
  setTextColor(doc, WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${rec} — Score ${vehicle.dealScore}/100`, W / 2, y + 11.5, { align: 'center' });
  y += 25;

  // Top reasons
  addSectionHeader(doc, 'Top Reasons', M, y);
  y += 8;

  const reasons =
    rec === 'BUY'
      ? ['Price is below market median', 'Solid ROI above 15%', 'Good sellability indicators', 'Normal scenario shows positive profit']
      : rec === 'CONSIDER'
      ? ['Price near market median', 'ROI marginal but acceptable', 'Some risk factors present', 'Verify tax before bidding']
      : ['Price above market or ROI negative', 'High risk indicators flagged', 'Recommend passing on this lot', 'Re-evaluate if price drops'];

  reasons.forEach((r, i) => {
    setTextColor(doc, i === 0 ? DARK_BLUE : DARK_TEXT);
    doc.setFontSize(9);
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
    doc.text(`${i + 1}. ${r}`, M + 5, y + i * 7);
  });
  y += reasons.length * 7 + 8;

  // Checklist
  addSectionHeader(doc, 'Next Steps Checklist', M, y);
  y += 8;

  const checklist = [
    rec !== 'DROP' ? '☐ Verify ASG registration tax before final bid' : '☐ Monitor price – re-evaluate if drops >10%',
    '☐ Confirm VAT scheme with accountant',
    '☐ Arrange transport quote',
    rec !== 'DROP' ? '☐ Place bid within Max Bid Balanced strategy' : '☐ Research alternative vehicles in pipeline',
    '☐ Pre-book preparation & Danish Syn',
    '☐ List on Bilinfo/DBA when ready',
  ];

  checklist.forEach((item, i) => {
    setTextColor(doc, DARK_TEXT);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(item, M + 5, y + i * 7);
  });
  y += checklist.length * 7 + 10;

  // Disclaimer
  setFill(doc, LIGHT_BG);
  doc.rect(M, y, W - M * 2, 22, 'F');
  setTextColor(doc, GRAY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  const disc = [
    'DISCLAIMER: This report is generated for information purposes only. ApexValue does not guarantee',
    'accuracy of market data, tax calculations, or profit projections. All tax figures marked "estimated"',
    'must be verified with official sources (ASG Digital) before bidding. This is not financial advice.',
    `Generated by ApexValue · Report ID: ${reportId} · ${genDate}`,
  ];
  disc.forEach((line, i) => {
    doc.text(line, M + 3, y + 5 + i * 4.5);
  });

  // ── Page numbers + footer ────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setFill(doc, DARK_BLUE);
    doc.rect(0, 287, W, 10, 'F');
    setTextColor(doc, POWDER);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`ApexValue · ${org.name} · ${reportId}`, M, 293.5);
    doc.text(`Page ${i} of ${pageCount}`, W - M, 293.5, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}

function addSectionHeader(doc: jsPDF, title: string, x: number, y: number) {
  setFill(doc, POWDER);
  doc.setFillColor(...hexToRGB(POWDER));
  doc.rect(x, y - 1, 3, 8, 'F');
  setFill(doc, DARK_BLUE);
  setTextColor(doc, DARK_BLUE);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x + 6, y + 5);
  setDrawColor(doc, POWDER);
  doc.setLineWidth(0.3);
  doc.line(x, y + 7, 210 - x, y + 7);
}

function addPageHeader(doc: jsPDF, title: string, orgName: string, reportId: string) {
  setFill(doc, DARK_BLUE);
  doc.rect(0, 0, 210, 22, 'F');
  setFill(doc, ORANGE);
  doc.rect(0, 22, 210, 2, 'F');
  setTextColor(doc, WHITE);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ApexValue', 15, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(title, 15, 17);
  setTextColor(doc, POWDER);
  doc.setFontSize(7);
  doc.text(`${orgName} · ${reportId}`, 210 - 15, 17, { align: 'right' });
}
