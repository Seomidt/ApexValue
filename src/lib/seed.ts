// ─── Demo Data Seeder ─────────────────────────────────────────────────────────
import { db } from './db';
import {
  organizations, users, vehicles, vehicleCosts, marketComps,
  taxRecords, profitScenarios, costTemplates, vehicleHistory,
  analyticsEvents,
} from './schema';
import { hashPassword } from './auth';
import { nanoid } from 'nanoid';
import { calcCompStats, calcProfitScenarios, calcTotalCost } from './calculations';

const DEMO_ORG_ID = 'demo-org-001';
const DEMO_USER_ID = 'demo-user-001';
const ADMIN_USER_ID = 'superadmin-001';
const ADMIN_ORG_ID = 'admin-org-001';

const makes = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Toyota', 'Volvo', 'Skoda', 'Ford'];
const modelsByMake: Record<string, string[]> = {
  BMW: ['3 Series', '5 Series', 'X3', 'X5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC'],
  Audi: ['A4', 'A6', 'Q5', 'Q7'],
  Volkswagen: ['Passat', 'Golf', 'Tiguan'],
  Toyota: ['RAV4', 'Corolla', 'C-HR'],
  Volvo: ['XC60', 'XC90', 'V90'],
  Skoda: ['Octavia', 'Superb', 'Kodiaq'],
  Ford: ['Focus', 'Mondeo', 'Kuga'],
};
const fuels = ['petrol', 'diesel', 'hybrid', 'electric'];
const gearboxes = ['auto', 'manual'];
const statuses = ['found', 'evaluating', 'bid_placed', 'won', 'transport', 'prep', 'ready', 'listed', 'sold'];
const sources = ['Auto1 Auction', 'BCA Germany', 'Copart DE', 'Manual Import'];
const sourceCountries = ['DE', 'NL', 'BE', 'FR', 'SE'];
const countries = ['DK', 'DE', 'NL', 'SE', 'NO', 'PL', 'BE', 'FR'];
const pages = ['/dashboard', '/auction-finder', '/vehicles', '/vat-center', '/pipeline'];
const eventTypes = ['page_view', 'login', 'vehicle_created', 'pdf_generated', 'tax_calculated'];

function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function seed() {
  console.log('Seeding ApexValue demo data...');

  try { await db.insert(organizations).values({ id: ADMIN_ORG_ID, name: 'ApexValue Admin', slug: 'apexvalue-admin', country: 'DK', plan: 'pro', isActive: true, isDemo: false }); } catch {}
  try { await db.insert(organizations).values({ id: DEMO_ORG_ID, name: 'Demo Dealer GmbH', slug: 'demo-dealer', vatId: 'DE123456789', country: 'DK', plan: 'free', isActive: true, isDemo: true }); } catch {}

  const adminHash = await hashPassword('Admin1234!');
  const demoHash = await hashPassword('Demo1234!');

  try { await db.insert(users).values({ id: ADMIN_USER_ID, orgId: ADMIN_ORG_ID, email: 'admin@apexvalue.net', passwordHash: adminHash, name: 'Super Admin', role: 'superadmin', isActive: true }); } catch {}
  try { await db.insert(users).values({ id: DEMO_USER_ID, orgId: DEMO_ORG_ID, email: 'demo@apexvalue.net', passwordHash: demoHash, name: 'Demo User', role: 'orgadmin', isActive: true }); } catch {}

  try {
    await db.insert(costTemplates).values({
      id: 'tpl-dk-standard', orgId: DEMO_ORG_ID, name: 'Standard DK Import', market: 'DK', isDefault: true,
      items: JSON.stringify([
        { category: 'transport', label: 'Transport EU→DK', amountEur: 650 },
        { category: 'prep', label: 'Service & detail', amountEur: 400 },
        { category: 'inspection', label: 'Danish Syn', amountEur: 2200 },
        { category: 'other', label: 'Misc', amountEur: 150 },
      ]),
    });
  } catch {}

  for (let i = 0; i < 40; i++) {
    const make = pick(makes);
    const model = pick(modelsByMake[make]);
    const year = rnd(2016, 2022);
    const km = rnd(20000, 180000);
    const fuel = pick(fuels);
    const gear = pick(gearboxes);
    const buy = rnd(6000, 32000);
    const auctionFee = rnd(200, 600);
    const statusIdx = i < 5 ? 0 : i < 10 ? 1 : i < 15 ? 4 : i < 20 ? 5 : i < 25 ? 6 : i < 35 ? 7 : 8;
    const status = statuses[Math.min(statusIdx, 8)];
    const score = rnd(28, 92);
    const vId = `demo-v-${String(i).padStart(3, '0')}`;

    try {
      await db.insert(vehicles).values({
        id: vId, orgId: DEMO_ORG_ID, make, model,
        variant: `${rnd(14, 30) * 10}d`, year, mileageKm: km,
        fuelType: fuel, gearbox: gear, color: pick(['Black', 'White', 'Silver', 'Blue', 'Grey']),
        doors: 4, sourceType: 'auction', sourceName: pick(sources), sourceCountry: pick(sourceCountries),
        buyPriceEur: buy, auctionFeeEur: auctionFee, status, isDemo: true, dealScore: score,
        targetMarket: 'DK', targetCurrency: 'DKK',
        notes: i % 5 === 0 ? 'Good condition. Minor scratch on rear bumper.' : null,
      });
    } catch { continue; }

    const costItems = [
      { id: nanoid(), vehicleId: vId, orgId: DEMO_ORG_ID, category: 'transport', label: 'Transport DE→DK', amountEur: rnd(400, 900), included: true },
      { id: nanoid(), vehicleId: vId, orgId: DEMO_ORG_ID, category: 'prep', label: 'Service & prep', amountEur: rnd(200, 800), included: true },
      { id: nanoid(), vehicleId: vId, orgId: DEMO_ORG_ID, category: 'inspection', label: 'Syn / registration', amountEur: rnd(1800, 3500), included: true },
      { id: nanoid(), vehicleId: vId, orgId: DEMO_ORG_ID, category: 'other', label: 'Miscellaneous', amountEur: 150, included: true },
    ];
    for (const c of costItems) { try { await db.insert(vehicleCosts).values(c); } catch {} }

    const compPrices: number[] = [];
    for (let j = 0; j < rnd(8, 20); j++) {
      const price = Math.round(buy * 1.35 * (0.8 + Math.random() * 0.5));
      compPrices.push(price);
      try {
        await db.insert(marketComps).values({
          id: nanoid(), vehicleId: vId, orgId: DEMO_ORG_ID, make, model,
          year: year + rnd(-1, 1), mileageKm: rnd(15000, 200000),
          priceEur: price, currency: 'EUR', market: 'DK',
          source: pick(['mobile.de', 'bilbasen.dk', 'autoscout24']),
          daysOnMarket: rnd(3, 90), isDemo: true,
        });
      } catch {}
    }

    const totalCost = calcTotalCost(buy + auctionFee, costItems.map(c => ({ category: c.category, label: c.label, amountEur: c.amountEur, included: true })));
    const stats = calcCompStats(compPrices);
    const profit = calcProfitScenarios(totalCost, stats);

    try {
      await db.insert(profitScenarios).values({
        id: nanoid(), vehicleId: vId, orgId: DEMO_ORG_ID, totalCostEur: totalCost,
        conservativeSellEur: profit.conservativeSell, normalSellEur: profit.normalSell, optimisticSellEur: profit.optimisticSell,
        conservativeProfitEur: profit.conservativeProfit, normalProfitEur: profit.normalProfit, optimisticProfitEur: profit.optimisticProfit,
        conservativeRoi: profit.conservativeROI, normalRoi: profit.normalROI, optimisticRoi: profit.optimisticROI,
        breakEvenEur: profit.breakEven, maxBidSafe: profit.maxBidSafe, maxBidBalanced: profit.maxBidBalanced, maxBidAggressive: profit.maxBidAggressive,
      });
    } catch {}

    try {
      await db.insert(taxRecords).values({
        id: nanoid(), vehicleId: vId, orgId: DEMO_ORG_ID, market: 'DK', scheme: 'standard',
        registrationTaxEur: Math.round(buy * 0.8), registrationTaxLocal: Math.round(buy * 0.8 * 7.46),
        currency: 'DKK', vatScheme: i % 3 === 0 ? 'margin' : i % 3 === 1 ? 'reverse_charge' : 'standard',
        isEstimated: true, source: 'estimated',
      });
    } catch {}

    try {
      await db.insert(vehicleHistory).values({
        id: nanoid(), vehicleId: vId, orgId: DEMO_ORG_ID, userId: DEMO_USER_ID,
        type: 'status_change', content: `Vehicle added with status: ${status}`,
      });
    } catch {}
  }

  for (let i = 0; i < 100; i++) {
    try {
      await db.insert(analyticsEvents).values({
        id: nanoid(), orgId: DEMO_ORG_ID, userId: DEMO_USER_ID, sessionId: nanoid(),
        event: pick(eventTypes), page: pick(pages), country: pick(countries),
        createdAt: new Date(Date.now() - rnd(0, 30 * 86400000)).toISOString(),
      });
    } catch {}
  }

  console.log('Seed complete! demo@apexvalue.net / Demo1234!');
}

export default seed;
