import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb, index, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export { sessions, users } from "./models/auth";
export type { User, UpsertUser } from "./models/auth";

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  mode: text("mode").notNull().default("demo"),
  marketCountry: text("market_country").notNull().default("DK"),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  orgId: integer("org_id").notNull(),
  role: text("role").notNull().default("buyer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  vin: text("vin"),
  plate: text("plate"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  variant: text("variant"),
  year: integer("year").notNull(),
  mileageKm: integer("mileage_km").notNull(),
  enginePower: integer("engine_power"),
  co2: integer("co2"),
  gearbox: text("gearbox").notNull().default("automatic"),
  fuelType: text("fuel_type").notNull().default("diesel"),
  color: text("color"),
  equipment: text("equipment").array(),
  imageUrls: text("image_urls").array(),
  sourceType: text("source_type").notNull().default("manual"),
  sourceUrl: text("source_url"),
  sourceCountry: text("source_country").notNull().default("DE"),
  purchasePrice: real("purchase_price"),
  purchaseCurrency: text("purchase_currency").notNull().default("EUR"),
  auctionFees: real("auction_fees").default(0),
  transportCost: real("transport_cost").default(0),
  preparationCost: real("preparation_cost").default(0),
  inspectionCost: real("inspection_cost").default(0),
  otherCosts: real("other_costs").default(0),
  registrationTax: real("registration_tax"),
  vatType: text("vat_type").notNull().default("unknown"),
  vatAmount: real("vat_amount"),
  vatReturn: real("vat_return"),
  resaleConservative: real("resale_conservative"),
  resaleNormal: real("resale_normal"),
  resaleOptimistic: real("resale_optimistic"),
  dealScore: integer("deal_score"),
  riskFlags: text("risk_flags").array(),
  status: text("status").notNull().default("found"),
  notes: text("notes"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketComps = pgTable("market_comps", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  orgId: integer("org_id").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  variant: text("variant"),
  year: integer("year").notNull(),
  mileageKm: integer("mileage_km").notNull(),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("DKK"),
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  location: text("location"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const costTemplates = pgTable("cost_templates", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id"),
  name: text("name").notNull(),
  marketCountry: text("market_country").notNull().default("DK"),
  currency: text("currency").notNull().default("DKK"),
  transport: real("transport").default(0),
  preparation: real("preparation").default(0),
  inspection: real("inspection").default(0),
  plates: real("plates").default(0),
  buffer: real("buffer").default(0),
  isDefault: boolean("is_default").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id"),
  userId: varchar("user_id"),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("idx_events_type").on(table.eventType), index("idx_events_created").on(table.createdAt)]);

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertMembershipSchema = createInsertSchema(memberships).omit({ id: true, createdAt: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketCompSchema = createInsertSchema(marketComps).omit({ id: true, createdAt: true });
export const insertCostTemplateSchema = createInsertSchema(costTemplates).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertMarketComp = z.infer<typeof insertMarketCompSchema>;
export type MarketComp = typeof marketComps.$inferSelect;
export type InsertCostTemplate = z.infer<typeof insertCostTemplateSchema>;
export type CostTemplate = typeof costTemplates.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const VEHICLE_STATUSES = [
  "found", "evaluating", "bid_placed", "won", "transport",
  "preparation", "ready_for_sale", "online", "sold"
] as const;

export const VAT_TYPES = [
  "eu_reverse_charge", "dk_vat", "margin", "private", "unknown"
] as const;

export const MARKET_COUNTRIES = [
  { code: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪" },
  { code: "DK", name: "Denmark", currency: "DKK", flag: "🇩🇰" },
  { code: "NL", name: "Netherlands", currency: "EUR", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", currency: "SEK", flag: "🇸🇪" },
  { code: "NO", name: "Norway", currency: "NOK", flag: "🇳🇴" },
  { code: "PL", name: "Poland", currency: "PLN", flag: "🇵🇱" },
  { code: "BE", name: "Belgium", currency: "EUR", flag: "🇧🇪" },
  { code: "FR", name: "France", currency: "EUR", flag: "🇫🇷" },
] as const;

export const ROLES = ["superadmin", "orgadmin", "buyer", "viewer"] as const;
export const PLANS = ["free", "trial", "pro", "team", "enterprise"] as const;
