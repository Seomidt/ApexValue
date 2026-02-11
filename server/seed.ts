import { db } from "./db";
import { vehicles, marketComps, costTemplates, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

const demoVehicles = [
  {
    orgId: 1, make: "BMW", model: "530d", variant: "xDrive M Sport", year: 2021,
    mileageKm: 78000, enginePower: 286, co2: 152, gearbox: "automatic", fuelType: "diesel",
    color: "Black Sapphire", sourceType: "auction", sourceUrl: "https://auto1.com/demo",
    sourceCountry: "DE", purchasePrice: 28500, purchaseCurrency: "EUR",
    auctionFees: 850, transportCost: 4500, preparationCost: 8000, inspectionCost: 1800,
    otherCosts: 2000, registrationTax: 95000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 285000, resaleNormal: 319000,
    resaleOptimistic: 345000, dealScore: 78, riskFlags: [] as string[],
    status: "evaluating", notes: "Clean Carfax, full BMW service history. M Sport package with adaptive suspension.",
    isDemo: true, imageUrls: [] as string[],
  },
  {
    orgId: 1, make: "Mercedes-Benz", model: "E220d", variant: "AMG Line", year: 2020,
    mileageKm: 95000, enginePower: 194, co2: 138, gearbox: "automatic", fuelType: "diesel",
    color: "Obsidian Black", sourceType: "auction", sourceUrl: "https://bca.com/demo",
    sourceCountry: "DE", purchasePrice: 22000, purchaseCurrency: "EUR",
    auctionFees: 750, transportCost: 4500, preparationCost: 12000, inspectionCost: 1800,
    otherCosts: 3000, registrationTax: 78000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 245000, resaleNormal: 275000,
    resaleOptimistic: 299000, dealScore: 72, riskFlags: ["High mileage"] as string[],
    status: "bid_placed", notes: "AMG Line with Night Package. Some paint correction needed on front bumper.",
    isDemo: true, imageUrls: [] as string[],
  },
  {
    orgId: 1, make: "Audi", model: "A6", variant: "50 TDI quattro S-line", year: 2022,
    mileageKm: 45000, enginePower: 286, co2: 168, gearbox: "automatic", fuelType: "diesel",
    color: "Mythos Black", sourceType: "auction", sourceCountry: "DE",
    purchasePrice: 35000, purchaseCurrency: "EUR",
    auctionFees: 900, transportCost: 4500, preparationCost: 5000, inspectionCost: 1800,
    otherCosts: 1500, registrationTax: 125000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 395000, resaleNormal: 435000,
    resaleOptimistic: 465000, dealScore: 82,
    riskFlags: [] as string[], status: "found", isDemo: true, imageUrls: [] as string[],
    notes: "Very low mileage for year. Full Audi service. Bang & Olufsen sound, Matrix LED.",
  },
  {
    orgId: 1, make: "Volkswagen", model: "Tiguan", variant: "2.0 TDI R-Line", year: 2021,
    mileageKm: 62000, enginePower: 200, co2: 158, gearbox: "automatic", fuelType: "diesel",
    color: "Pure White", sourceType: "auction", sourceCountry: "DE",
    purchasePrice: 21000, purchaseCurrency: "EUR",
    auctionFees: 650, transportCost: 4500, preparationCost: 6000, inspectionCost: 1800,
    otherCosts: 1500, registrationTax: 68000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 225000, resaleNormal: 259000,
    resaleOptimistic: 279000, dealScore: 75,
    riskFlags: [] as string[], status: "won", isDemo: true, imageUrls: [] as string[],
    notes: "R-Line with panoramic roof. Popular model in DK market.",
  },
  {
    orgId: 1, make: "Volvo", model: "XC60", variant: "B5 AWD Inscription", year: 2021,
    mileageKm: 55000, enginePower: 250, co2: 155, gearbox: "automatic", fuelType: "diesel",
    color: "Crystal White", sourceType: "auction", sourceCountry: "SE",
    purchasePrice: 26000, purchaseCurrency: "EUR",
    auctionFees: 800, transportCost: 3500, preparationCost: 7000, inspectionCost: 1800,
    otherCosts: 2000, registrationTax: 88000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 295000, resaleNormal: 329000,
    resaleOptimistic: 359000, dealScore: 76,
    riskFlags: [] as string[], status: "transport", isDemo: true, imageUrls: [] as string[],
    notes: "Inscription trim with all safety features. Bowers & Wilkins audio.",
  },
  {
    orgId: 1, make: "Porsche", model: "Cayenne", variant: "Coupe", year: 2020,
    mileageKm: 68000, enginePower: 340, co2: 228, gearbox: "automatic", fuelType: "petrol",
    color: "Carrara White", sourceType: "auction", sourceCountry: "DE",
    purchasePrice: 52000, purchaseCurrency: "EUR",
    auctionFees: 1200, transportCost: 5000, preparationCost: 15000, inspectionCost: 2500,
    otherCosts: 3000, registrationTax: 285000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 695000, resaleNormal: 749000,
    resaleOptimistic: 795000, dealScore: 55,
    riskFlags: ["High capital binding"] as string[], status: "evaluating", isDemo: true,
    imageUrls: [] as string[],
    notes: "High-value unit. Sport Chrono, PASM, 21-inch wheels. Full Porsche service.",
  },
  {
    orgId: 1, make: "BMW", model: "X3", variant: "xDrive20d M Sport", year: 2022,
    mileageKm: 38000, enginePower: 190, co2: 148, gearbox: "automatic", fuelType: "diesel",
    color: "Phytonic Blue", sourceType: "auction", sourceCountry: "DE",
    purchasePrice: 30000, purchaseCurrency: "EUR",
    auctionFees: 800, transportCost: 4500, preparationCost: 4000, inspectionCost: 1800,
    otherCosts: 1500, registrationTax: 82000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 345000, resaleNormal: 379000,
    resaleOptimistic: 399000, dealScore: 85,
    riskFlags: [] as string[], status: "found", isDemo: true, imageUrls: [] as string[],
    notes: "Top scorer. Low km, popular color and spec. M Sport with Vernasca leather.",
  },
  {
    orgId: 1, make: "Mercedes-Benz", model: "GLC 300d", variant: "4MATIC AMG", year: 2021,
    mileageKm: 72000, enginePower: 245, co2: 162, gearbox: "automatic", fuelType: "diesel",
    color: "Selenite Grey", sourceType: "auction", sourceCountry: "DE",
    purchasePrice: 32000, purchaseCurrency: "EUR",
    auctionFees: 850, transportCost: 4500, preparationCost: 9000, inspectionCost: 1800,
    otherCosts: 2000, registrationTax: 98000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 365000, resaleNormal: 399000,
    resaleOptimistic: 429000, dealScore: 71,
    riskFlags: [] as string[], status: "preparation", isDemo: true, imageUrls: [] as string[],
    notes: "AMG package, Burmester sound, 360 camera. Ready after paint touch-up.",
  },
  {
    orgId: 1, make: "Skoda", model: "Octavia", variant: "2.0 TDI Style", year: 2022,
    mileageKm: 42000, enginePower: 150, co2: 118, gearbox: "automatic", fuelType: "diesel",
    color: "Moon White", sourceType: "manual", sourceCountry: "PL",
    purchasePrice: 14000, purchaseCurrency: "EUR",
    auctionFees: 400, transportCost: 3000, preparationCost: 3000, inspectionCost: 1500,
    otherCosts: 1000, registrationTax: 22000, vatType: "margin" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 155000, resaleNormal: 175000,
    resaleOptimistic: 189000, dealScore: 88,
    riskFlags: [] as string[], status: "ready_for_sale", isDemo: true, imageUrls: [] as string[],
    notes: "Excellent budget option. High ROI. Very popular in DK. Clean car.",
  },
  {
    orgId: 1, make: "Tesla", model: "Model 3", variant: "Long Range AWD", year: 2021,
    mileageKm: 48000, enginePower: 346, co2: 0, gearbox: "automatic", fuelType: "electric",
    color: "Pearl White", sourceType: "auction", sourceCountry: "NL",
    purchasePrice: 27000, purchaseCurrency: "EUR",
    auctionFees: 700, transportCost: 4000, preparationCost: 3000, inspectionCost: 1500,
    otherCosts: 1000, registrationTax: 0, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 245000, resaleNormal: 269000,
    resaleOptimistic: 289000, dealScore: 90,
    riskFlags: [] as string[], status: "online", isDemo: true, imageUrls: [] as string[],
    notes: "Zero registration tax for EVs. Highest deal score in demo. Full autopilot.",
  },
  {
    orgId: 1, make: "Peugeot", model: "3008", variant: "1.5 BlueHDi GT", year: 2020,
    mileageKm: 112000, enginePower: 130, co2: 128, gearbox: "automatic", fuelType: "diesel",
    color: "Amazonite Grey", sourceType: "manual", sourceCountry: "FR",
    purchasePrice: 13500, purchaseCurrency: "EUR",
    auctionFees: 500, transportCost: 5000, preparationCost: 8000, inspectionCost: 1800,
    otherCosts: 2000, registrationTax: 45000, vatType: "unknown" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 145000, resaleNormal: 165000,
    resaleOptimistic: 179000, dealScore: 35,
    riskFlags: ["High mileage", "Unknown VAT type"] as string[], status: "evaluating", isDemo: true,
    imageUrls: [] as string[],
    notes: "High km but priced accordingly. VAT status needs verification. GT trim popular.",
  },
  {
    orgId: 1, make: "Land Rover", model: "Range Rover Sport", variant: "3.0 SDV6 HSE", year: 2019,
    mileageKm: 92000, enginePower: 306, co2: 199, gearbox: "automatic", fuelType: "diesel",
    color: "Santorini Black", sourceType: "auction", sourceCountry: "DE",
    purchasePrice: 38000, purchaseCurrency: "EUR",
    auctionFees: 1100, transportCost: 5500, preparationCost: 18000, inspectionCost: 2500,
    otherCosts: 5000, registrationTax: 195000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 495000, resaleNormal: 545000,
    resaleOptimistic: 589000, dealScore: 42,
    riskFlags: ["High mileage", "High capital binding"] as string[], status: "found", isDemo: true,
    imageUrls: [] as string[],
    notes: "High risk, high reward. Known for expensive repairs. Full service required.",
  },
  {
    orgId: 1, make: "Audi", model: "Q5", variant: "40 TDI quattro S-line", year: 2022,
    mileageKm: 35000, enginePower: 204, co2: 152, gearbox: "automatic", fuelType: "diesel",
    color: "Navarra Blue", sourceType: "auction", sourceCountry: "DE",
    purchasePrice: 32000, purchaseCurrency: "EUR",
    auctionFees: 850, transportCost: 4500, preparationCost: 4000, inspectionCost: 1800,
    otherCosts: 1500, registrationTax: 92000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 355000, resaleNormal: 389000,
    resaleOptimistic: 415000, dealScore: 80,
    riskFlags: [] as string[], status: "found", isDemo: true, imageUrls: [] as string[],
    notes: "Low km Q5 S-line. Virtual cockpit, Matrix LED. Strong resale in DK.",
  },
  {
    orgId: 1, make: "Toyota", model: "RAV4", variant: "2.5 Hybrid AWD", year: 2021,
    mileageKm: 52000, enginePower: 222, co2: 119, gearbox: "automatic", fuelType: "hybrid",
    color: "Dynamic Blue", sourceType: "manual", sourceCountry: "BE",
    purchasePrice: 24000, purchaseCurrency: "EUR",
    auctionFees: 600, transportCost: 4000, preparationCost: 3500, inspectionCost: 1500,
    otherCosts: 1000, registrationTax: 28000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 265000, resaleNormal: 295000,
    resaleOptimistic: 319000, dealScore: 84,
    riskFlags: [] as string[], status: "found", isDemo: true, imageUrls: [] as string[],
    notes: "Low registration tax due to hybrid. Very reliable. Strong demand.",
  },
  {
    orgId: 1, make: "BMW", model: "520d", variant: "Touring M Sport", year: 2020,
    mileageKm: 118000, enginePower: 190, co2: 142, gearbox: "automatic", fuelType: "diesel",
    color: "Mineral Grey", sourceType: "auction", sourceCountry: "DE",
    purchasePrice: 19000, purchaseCurrency: "EUR",
    auctionFees: 650, transportCost: 4500, preparationCost: 12000, inspectionCost: 1800,
    otherCosts: 3000, registrationTax: 72000, vatType: "eu_reverse_charge" as const,
    vatAmount: 0, vatReturn: 0, resaleConservative: 225000, resaleNormal: 255000,
    resaleOptimistic: 279000, dealScore: 58,
    riskFlags: ["High mileage"] as string[], status: "sold", isDemo: true, imageUrls: [] as string[],
    notes: "Sold for 262,000 DKK. Good profit despite high km. Touring very popular.",
  },
];

function generateComps(vehicleId: number, make: string, model: string, year: number, basePrice: number, orgId: number): any[] {
  const comps = [];
  const count = 8 + Math.floor(Math.random() * 12);
  for (let i = 0; i < count; i++) {
    const yearVariation = Math.random() > 0.3 ? 0 : (Math.random() > 0.5 ? 1 : -1);
    const priceVariation = 0.75 + Math.random() * 0.5;
    const kmVariation = 0.5 + Math.random() * 1.5;
    const locations = ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Roskilde", "Herning"];
    comps.push({
      vehicleId,
      orgId,
      make,
      model,
      variant: "",
      year: year + yearVariation,
      mileageKm: Math.round(70000 * kmVariation),
      price: Math.round(basePrice * priceVariation),
      currency: "DKK",
      source: Math.random() > 0.5 ? "bilbasen.dk" : "mobile.de",
      location: locations[Math.floor(Math.random() * locations.length)],
      isDemo: true,
    });
  }
  return comps;
}

const demoCostTemplates = [
  { name: "Standard DK Import", marketCountry: "DK", currency: "DKK", transport: 4500, preparation: 8000, inspection: 1800, plates: 1200, buffer: 3000, isDefault: true, isDemo: true },
  { name: "Premium DK Import", marketCountry: "DK", currency: "DKK", transport: 5500, preparation: 15000, inspection: 2500, plates: 1200, buffer: 5000, isDefault: false, isDemo: true },
  { name: "Budget DK Import", marketCountry: "DK", currency: "DKK", transport: 3500, preparation: 4000, inspection: 1500, plates: 1200, buffer: 2000, isDefault: false, isDemo: true },
  { name: "Standard DE Domestic", marketCountry: "DE", currency: "EUR", transport: 500, preparation: 1500, inspection: 200, plates: 100, buffer: 500, isDefault: true, isDemo: true },
  { name: "Standard PL Import", marketCountry: "PL", currency: "PLN", transport: 3000, preparation: 5000, inspection: 800, plates: 500, buffer: 2000, isDefault: true, isDemo: true },
  { name: "Standard NL Import", marketCountry: "NL", currency: "EUR", transport: 800, preparation: 2000, inspection: 300, plates: 150, buffer: 800, isDefault: true, isDemo: true },
  { name: "Standard SE Import", marketCountry: "SE", currency: "SEK", transport: 8000, preparation: 12000, inspection: 2000, plates: 1500, buffer: 4000, isDefault: true, isDemo: true },
  { name: "Standard NO Import", marketCountry: "NO", currency: "NOK", transport: 9000, preparation: 15000, inspection: 2500, plates: 2000, buffer: 5000, isDefault: true, isDemo: true },
];

export async function seedDemoData() {
  try {
    const existing = await db.select().from(vehicles).where(eq(vehicles.isDemo, true)).limit(1);
    if (existing.length > 0) {
      return;
    }

    console.log("Seeding demo data...");

    const [demoOrg] = await db.insert(organizations).values({
      name: "Demo Organization",
      slug: "demo-org",
      plan: "free",
      status: "active",
      mode: "demo",
      marketCountry: "DK",
      language: "en",
    }).returning();

    for (const vehicleData of demoVehicles) {
      vehicleData.orgId = demoOrg.id;
      const [created] = await db.insert(vehicles).values(vehicleData).returning();

      const resalePrice = vehicleData.resaleNormal || 300000;
      const comps = generateComps(created.id, vehicleData.make, vehicleData.model, vehicleData.year, resalePrice, demoOrg.id);
      if (comps.length > 0) {
        await db.insert(marketComps).values(comps);
      }
    }

    for (const template of demoCostTemplates) {
      await db.insert(costTemplates).values({ ...template, orgId: demoOrg.id });
    }

    console.log(`Seeded ${demoVehicles.length} demo vehicles with market comps and ${demoCostTemplates.length} cost templates`);
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
}
