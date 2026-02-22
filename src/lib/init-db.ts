// ─── Database Init & Migration ─────────────────────────────────────────────────
// Creates all tables from schema on first run.
// Called from the app startup or npm run db:push.
import { db } from './db';
import { sql } from 'drizzle-orm';

export async function initDB() {
  // Create tables using raw SQL for libsql compatibility
  const tables = [
    `CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      logo_url TEXT, vat_id TEXT, country TEXT DEFAULT 'DK',
      plan TEXT DEFAULT 'free', is_active INTEGER DEFAULT 1, is_demo INTEGER DEFAULT 0,
      storage_used_bytes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, name TEXT NOT NULL, role TEXT DEFAULT 'user',
      avatar_url TEXT, language TEXT DEFAULT 'en', default_market TEXT DEFAULT 'DK',
      is_active INTEGER DEFAULT 1, last_seen_at TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, vin TEXT, license_plate TEXT,
      make TEXT NOT NULL, model TEXT NOT NULL, variant TEXT, year INTEGER NOT NULL,
      mileage_km INTEGER NOT NULL, fuel_type TEXT, gearbox TEXT, color TEXT, doors INTEGER,
      source_type TEXT DEFAULT 'manual', source_url TEXT, source_id TEXT, source_name TEXT,
      source_country TEXT DEFAULT 'DE', buy_price_eur REAL, auction_fee_eur REAL DEFAULT 0,
      status TEXT DEFAULT 'found', is_demo INTEGER DEFAULT 0, deal_score INTEGER DEFAULT 0,
      target_market TEXT DEFAULT 'DK', target_currency TEXT DEFAULT 'DKK',
      primary_image_url TEXT, image_count INTEGER DEFAULT 0, notes TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
      won_at TEXT, sold_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS vehicle_costs (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, org_id TEXT NOT NULL,
      category TEXT NOT NULL, label TEXT NOT NULL, amount_eur REAL NOT NULL DEFAULT 0,
      amount_local REAL, currency TEXT DEFAULT 'EUR', included INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS market_comps (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, org_id TEXT NOT NULL,
      make TEXT NOT NULL, model TEXT NOT NULL, year INTEGER, mileage_km INTEGER,
      price_eur REAL NOT NULL, price_local REAL, currency TEXT DEFAULT 'EUR',
      market TEXT DEFAULT 'DK', source TEXT, listing_url TEXT,
      days_on_market INTEGER, is_demo INTEGER DEFAULT 0,
      fetched_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS tax_records (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, org_id TEXT NOT NULL,
      market TEXT DEFAULT 'DK', scheme TEXT, registration_tax_eur REAL,
      registration_tax_local REAL, currency TEXT DEFAULT 'DKK',
      vat_scheme TEXT, vat_amount_eur REAL, vat_return_eur REAL,
      capital_binding_indicator TEXT, source TEXT DEFAULT 'manual',
      is_estimated INTEGER DEFAULT 1, calculated_at TEXT DEFAULT (datetime('now')), raw_response TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS vat_calculations (
      id TEXT PRIMARY KEY, vehicle_id TEXT, org_id TEXT NOT NULL,
      scheme TEXT NOT NULL, buy_price_eur REAL NOT NULL, buy_vat_eur REAL DEFAULT 0,
      sell_price_eur REAL, sell_vat_eur REAL DEFAULT 0, margin_eur REAL,
      vat_on_margin_eur REAL, net_vat_payable_eur REAL, vat_return_eur REAL DEFAULT 0,
      capital_binding TEXT, created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS profit_scenarios (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, org_id TEXT NOT NULL,
      total_cost_eur REAL NOT NULL, conservative_sell_eur REAL, normal_sell_eur REAL,
      optimistic_sell_eur REAL, conservative_profit_eur REAL, normal_profit_eur REAL,
      optimistic_profit_eur REAL, conservative_roi REAL, normal_roi REAL, optimistic_roi REAL,
      break_even_eur REAL, max_bid_safe REAL, max_bid_balanced REAL, max_bid_aggressive REAL,
      calculated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS cost_templates (
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL,
      market TEXT DEFAULT 'DK', is_default INTEGER DEFAULT 0,
      items TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS vehicle_files (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, org_id TEXT NOT NULL,
      type TEXT NOT NULL, subtype TEXT, original_name TEXT NOT NULL,
      r2_key TEXT NOT NULL, r2_url TEXT, thumbnail_key TEXT, mime_type TEXT,
      size_bytes INTEGER DEFAULT 0, width INTEGER, height INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS pdf_reports (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, org_id TEXT NOT NULL,
      version INTEGER DEFAULT 1, r2_key TEXT, local_path TEXT,
      size_bytes INTEGER DEFAULT 0, recommendation TEXT, deal_score INTEGER,
      generated_at TEXT DEFAULT (datetime('now')), generated_by TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, provider TEXT NOT NULL,
      encrypted_key TEXT, encrypted_secret TEXT, is_enabled INTEGER DEFAULT 0,
      last_test_at TEXT, last_test_ok INTEGER, last_test_message TEXT,
      last_success_at TEXT, usage_count INTEGER DEFAULT 0, key_masked TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY, org_id TEXT, user_id TEXT, session_id TEXT,
      event TEXT NOT NULL, page TEXT, country TEXT, user_agent TEXT, metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS online_heartbeats (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, org_id TEXT,
      country TEXT, page TEXT, last_seen TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, user_id TEXT,
      action TEXT NOT NULL, entity_type TEXT, entity_id TEXT,
      before TEXT, after TEXT, ip TEXT, created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS vehicle_history (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, org_id TEXT NOT NULL,
      user_id TEXT, type TEXT NOT NULL, content TEXT, metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS pipeline_checklists (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, org_id TEXT NOT NULL,
      items TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now'))
    )`,
  ];

  for (const table of tables) {
    await db.run(sql.raw(table));
  }

  console.log('✅ Database tables ready');
}
