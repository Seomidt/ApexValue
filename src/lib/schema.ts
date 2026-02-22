import { sql } from 'drizzle-orm';
import {
  text,
  integer,
  real,
  blob,
  sqliteTable,
} from 'drizzle-orm/sqlite-core';

// ─── Organizations ────────────────────────────────────────────────────────────
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  vatId: text('vat_id'),
  country: text('country').default('DK'),
  plan: text('plan').default('free'), // free | pro | team
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false),
  storageUsedBytes: integer('storage_used_bytes').default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').default('user'), // superadmin | orgadmin | user | viewer
  avatarUrl: text('avatar_url'),
  language: text('language').default('en'),
  defaultMarket: text('default_market').default('DK'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastSeenAt: text('last_seen_at'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  // Identification
  vin: text('vin'),
  licensePlate: text('license_plate'),
  make: text('make').notNull(),
  model: text('model').notNull(),
  variant: text('variant'),
  year: integer('year').notNull(),
  mileageKm: integer('mileage_km').notNull(),
  fuelType: text('fuel_type'), // petrol | diesel | hybrid | electric | other
  gearbox: text('gearbox'), // auto | manual
  color: text('color'),
  doors: integer('doors'),
  // Source / Auction
  sourceType: text('source_type').default('manual'), // manual | auction | import
  sourceUrl: text('source_url'),
  sourceId: text('source_id'),
  sourceName: text('source_name'),
  sourceCountry: text('source_country').default('DE'),
  buyPriceEur: real('buy_price_eur'),
  auctionFeeEur: real('auction_fee_eur').default(0),
  // Status
  status: text('status').default('found'), // found|evaluating|bid_placed|won|transport|prep|ready|listed|sold
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false),
  dealScore: integer('deal_score').default(0),
  // Market
  targetMarket: text('target_market').default('DK'),
  targetCurrency: text('target_currency').default('DKK'),
  // Images
  primaryImageUrl: text('primary_image_url'),
  imageCount: integer('image_count').default(0),
  // Notes
  notes: text('notes'),
  // Timestamps
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  wonAt: text('won_at'),
  soldAt: text('sold_at'),
});

// ─── Vehicle Cost Items ───────────────────────────────────────────────────────
export const vehicleCosts = sqliteTable('vehicle_costs', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  category: text('category').notNull(), // transport|prep|inspection|registration|tax|other
  label: text('label').notNull(),
  amountEur: real('amount_eur').notNull().default(0),
  amountLocal: real('amount_local'),
  currency: text('currency').default('EUR'),
  included: integer('included', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── Market Comps ─────────────────────────────────────────────────────────────
export const marketComps = sqliteTable('market_comps', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  // Comp vehicle
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year'),
  mileageKm: integer('mileage_km'),
  priceEur: real('price_eur').notNull(),
  priceLocal: real('price_local'),
  currency: text('currency').default('EUR'),
  market: text('market').default('DK'),
  source: text('source'), // mobile.de | bilbasen | autoscout24 | manual
  listingUrl: text('listing_url'),
  daysOnMarket: integer('days_on_market'),
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false),
  fetchedAt: text('fetched_at').default(sql`(datetime('now'))`),
});

// ─── Tax / Registration Records ──────────────────────────────────────────────
export const taxRecords = sqliteTable('tax_records', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  market: text('market').default('DK'),
  scheme: text('scheme'), // standard | ev_reduced | commercial
  registrationTaxEur: real('registration_tax_eur'),
  registrationTaxLocal: real('registration_tax_local'),
  currency: text('currency').default('DKK'),
  vatScheme: text('vat_scheme'), // margin | reverse_charge | standard | private
  vatAmountEur: real('vat_amount_eur'),
  vatReturnEur: real('vat_return_eur'),
  capitalBindingIndicator: text('capital_binding_indicator'), // low | medium | high
  source: text('source').default('manual'), // manual | asg | estimated
  isEstimated: integer('is_estimated', { mode: 'boolean' }).default(true),
  calculatedAt: text('calculated_at').default(sql`(datetime('now'))`),
  rawResponse: text('raw_response'), // JSON blob from ASG or calculator
});

// ─── VAT Calculations ─────────────────────────────────────────────────────────
export const vatCalculations = sqliteTable('vat_calculations', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  scheme: text('scheme').notNull(), // margin | reverse_charge | standard | private
  buyPriceEur: real('buy_price_eur').notNull(),
  buyVatEur: real('buy_vat_eur').default(0),
  sellPriceEur: real('sell_price_eur'),
  sellVatEur: real('sell_vat_eur').default(0),
  marginEur: real('margin_eur'),
  vatOnMarginEur: real('vat_on_margin_eur'),
  netVatPayableEur: real('net_vat_payable_eur'),
  vatReturnEur: real('vat_return_eur').default(0),
  capitalBinding: text('capital_binding'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── Profit Scenarios ────────────────────────────────────────────────────────
export const profitScenarios = sqliteTable('profit_scenarios', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  // Costs
  totalCostEur: real('total_cost_eur').notNull(),
  // Scenarios
  conservativeSellEur: real('conservative_sell_eur'),
  normalSellEur: real('normal_sell_eur'),
  optimisticSellEur: real('optimistic_sell_eur'),
  conservativeProfitEur: real('conservative_profit_eur'),
  normalProfitEur: real('normal_profit_eur'),
  optimisticProfitEur: real('optimistic_profit_eur'),
  conservativeRoi: real('conservative_roi'),
  normalRoi: real('normal_roi'),
  optimisticRoi: real('optimistic_roi'),
  breakEvenEur: real('break_even_eur'),
  maxBidSafe: real('max_bid_safe'),
  maxBidBalanced: real('max_bid_balanced'),
  maxBidAggressive: real('max_bid_aggressive'),
  calculatedAt: text('calculated_at').default(sql`(datetime('now'))`),
});

// ─── Cost Templates ──────────────────────────────────────────────────────────
export const costTemplates = sqliteTable('cost_templates', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  market: text('market').default('DK'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  items: text('items').notNull(), // JSON array
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── Vehicle Files (metadata only - actual files in R2) ───────────────────────
export const vehicleFiles = sqliteTable('vehicle_files', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  type: text('type').notNull(), // image | document | report
  subtype: text('subtype'), // primary | gallery | invoice | registration | pdf_report
  originalName: text('original_name').notNull(),
  r2Key: text('r2_key').notNull(),
  r2Url: text('r2_url'),
  thumbnailKey: text('thumbnail_key'),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes').default(0),
  width: integer('width'),
  height: integer('height'),
  uploadedAt: text('uploaded_at').default(sql`(datetime('now'))`),
});

// ─── PDF Reports ─────────────────────────────────────────────────────────────
export const pdfReports = sqliteTable('pdf_reports', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  version: integer('version').default(1),
  r2Key: text('r2_key'),
  localPath: text('local_path'), // fallback if R2 not enabled
  sizeBytes: integer('size_bytes').default(0),
  recommendation: text('recommendation'), // BUY | CONSIDER | DROP
  dealScore: integer('deal_score'),
  generatedAt: text('generated_at').default(sql`(datetime('now'))`),
  generatedBy: text('generated_by').references(() => users.id),
});

// ─── BYOK Integrations ────────────────────────────────────────────────────────
export const integrations = sqliteTable('integrations', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  provider: text('provider').notNull(), // mobile_de | auto1 | bilinfo | asg
  encryptedKey: text('encrypted_key'),
  encryptedSecret: text('encrypted_secret'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(false),
  lastTestAt: text('last_test_at'),
  lastTestOk: integer('last_test_ok', { mode: 'boolean' }),
  lastTestMessage: text('last_test_message'),
  lastSuccessAt: text('last_success_at'),
  usageCount: integer('usage_count').default(0),
  keyMasked: text('key_masked'), // last 4 chars shown in UI
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ─── Analytics Events ─────────────────────────────────────────────────────────
export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey(),
  orgId: text('org_id'),
  userId: text('user_id'),
  sessionId: text('session_id'),
  event: text('event').notNull(), // page_view | signup | login | vehicle_created | etc.
  page: text('page'),
  country: text('country'),
  userAgent: text('user_agent'),
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── Online Heartbeats ────────────────────────────────────────────────────────
export const onlineHeartbeats = sqliteTable('online_heartbeats', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  orgId: text('org_id'),
  country: text('country'),
  page: text('page'),
  lastSeen: text('last_seen').default(sql`(datetime('now'))`),
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull(),
  userId: text('user_id'),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  before: text('before'), // JSON
  after: text('after'), // JSON
  ip: text('ip'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── Vehicle Notes / History ──────────────────────────────────────────────────
export const vehicleHistory = sqliteTable('vehicle_history', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(), // note | status_change | file_upload | pdf_generated | api_call
  content: text('content'),
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── Pipeline Checklists ──────────────────────────────────────────────────────
export const pipelineChecklists = sqliteTable('pipeline_checklists', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  orgId: text('org_id').notNull(),
  items: text('items').notNull(), // JSON checklist items
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});
