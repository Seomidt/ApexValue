# ApexValue — Dealer Cockpit

> B2B SaaS for European car import/export dealers. Find auctions, model profit/VAT, track pipeline, generate reports.

**Gulf Racing theme · Next.js 14 · TypeScript · SQLite/libSQL · JWT auth · Demo Mode built-in**

---

## 🚀 Quick Start (StackBlitz / Local)

```bash
npm install
npm run dev        # starts on http://localhost:3000
```

Then visit `http://localhost:3000` and click **Try Demo** or log in with:
- Demo: `demo@apexvalue.net` / `Demo1234!`
- Admin: `admin@apexvalue.net` / `Admin1234!`

The app auto-initializes the SQLite database and seeds demo data on first run.

---

## 🗂️ Project Structure

```
src/
  app/
    (auth)/           # Login, signup, reset-password
    (app)/            # Authenticated app shell
      dashboard/      # KPI cockpit
      auction-finder/ # Demo auction vehicles with filtering
      vehicles/       # Vehicle list + [id] detail (6 tabs)
      vat-center/     # VAT scheme calculator
      pipeline/       # Kanban pipeline + Bilinfo checklist
      reports/        # PDF report list + download
      analytics/      # Internal analytics dashboard
      settings/       # Profile, org, APIs (BYOK), billing
      admin/          # SuperAdmin panel
    api/              # All REST API routes
  components/
    ui/               # Button, Card, Badge, Tabs, KPICard, etc.
    layout/           # Sidebar, DemoBanner
  lib/
    db.ts             # Drizzle ORM + libsql connection
    schema.ts         # Full database schema
    auth.ts           # JWT sessions + password hashing
    calculations.ts   # Core profit/VAT/score engine (pure functions)
    pdf.ts            # jsPDF report generator
    analytics.ts      # Event tracking + heartbeat
    r2.ts             # Cloudflare R2 (feature-flagged)
    seed.ts           # Demo data seeder (40 vehicles + comps)
    connectors/       # BYOK connector stubs (Auto1, mobile.de, ASG, Bilinfo)
    i18n/             # EN + DA translations
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Required
DATABASE_URL=file:./apexvalue.db   # or libsql://your-turso-db.turso.io
APP_BASE_URL=https://app.apexvalue.net
JWT_SECRET=your-secret-min-32-chars
SESSION_SECRET=your-secret-min-32-chars

# Feature flags (default: all false in demo mode)
ENABLE_LIVE_MODE=false             # Set true + Pro plan to unlock APIs
ENABLE_STRIPE=false                # Set true when Stripe keys ready
ENABLE_R2=false                    # Set true + R2 keys to enable file storage

# Cloudflare R2 (optional, needed when ENABLE_R2=true)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=apexvalue-files
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Stripe (optional, needed when ENABLE_STRIPE=true)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...
```

---

## 🔒 Feature Gating

| Feature | Free (Demo) | Pro | Team |
|---------|-------------|-----|------|
| All modules (demo data) | ✅ | ✅ | ✅ |
| BYOK API integrations | ❌ | ✅ | ✅ |
| Live auction data | ❌ | ✅ | ✅ |
| Unlimited vehicles | 40 demo | ✅ | ✅ |
| PDF reports | ✅ (demo) | ✅ | ✅ |
| Multiple users | ❌ | ❌ | ✅ (10) |

Live mode requires: `ENABLE_LIVE_MODE=true` + Pro/Team plan + API keys configured in Settings.

---

## 🧮 Core Calculations

All calculations are pure functions in `src/lib/calculations.ts`:

- **Total Cost** = buy + fees + transport + prep + reg/syn + other − VAT_return
- **Profit Scenarios** = Conservative (P25 comps) / Normal (median) / Optimistic (P75)
- **ROI** = profit / totalCost
- **Max Bid** = targetSell − otherCosts − profitBuffer (Safe: €2k / Balanced: €1k / Aggressive: €500)
- **Deal Score** 0–100: Price vs market (40) + Profit/ROI (30) + Tax/VAT certainty (15) + Sellability (10) + Data quality (5)
- **VAT Schemes**: margin | reverse_charge | standard | private — all with capital binding indicator

---

## 📄 PDF Reports

Generated server-side using jsPDF (pure JS, works everywhere).

3-page format:
1. **Cover** — org, vehicle summary, deal score, BUY/CONSIDER/DROP badge
2. **Financial** — market comps table, cost breakdown, profit scenarios, max bids
3. **Conclusion** — recommendation, top reasons, risk flags, next steps checklist

---

## 🌍 Supported Markets

DE, DK, NL, SE, NO, PL, BE, FR

Languages: **EN** (full) + **DA** (full) — add more by extending `src/lib/i18n/`.

---

## 🔌 Connector Stubs (BYOK)

All 4 connectors are UI-ready and interface-complete. Implement real API calls in V2:

- **Auto1 Group** — auction inventory
- **mobile.de** — market comparables
- **Bilinfo** — listing distribution
- **ASG Digital** — Danish registration tax

Enable in Settings → APIs (requires Pro plan + `ENABLE_LIVE_MODE=true`).

---

## 🚢 Migration Off Replit

1. **Export database**: `cp apexvalue.db /backup/` (SQLite file) or use Turso for cloud SQLite
2. **Switch to Postgres**: Update `DATABASE_URL=postgresql://...` and use Drizzle postgres adapter
3. **DNS**: Point `app.apexvalue.net` to new host, `apexvalue.net` → marketing site
4. **Environment**: Set all env vars in new host's dashboard
5. **R2**: Already cloud-hosted — no migration needed
6. **Docker**: `docker build -t apexvalue . && docker run -p 3000:3000 --env-file .env apexvalue`

### DNS Setup
```
apexvalue.net          → marketing/landing (this repo or separate)
app.apexvalue.net      → this Next.js app
apexvalue.net/app      → 301 redirect → app.apexvalue.net (configured in next.config.js)
```

---

## 🔐 Security Notes

- BYOK keys stored encrypted in DB (field-level encryption — implement in production with KMS)
- Session tokens are HTTP-only cookies, 30-day expiry
- All data is org-scoped (multi-tenant isolation)
- Audit log on sensitive operations
- Rate limit sensitive endpoints (add `@upstash/ratelimit` for production)
- Short-lived presigned URLs for R2 (5min default)

---

## 📊 Analytics

Events tracked: `page_view | signup | login | vehicle_created | auction_imported | comps_fetched | tax_calculated | pdf_generated | max_bid_calculated | status_changed | file_uploaded | heartbeat`

Realtime "online now" via 30s heartbeat. No personal data — only org ID + country + page + timestamp.

---

## 🏁 Gulf Racing Theme

| Color | Hex | Use |
|-------|-----|-----|
| Gulf Blue | `#002776` | Sidebar, headers |
| Gulf Orange | `#FF6319` | CTAs, badges, accents |
| Powder Blue | `#B9D9EB` | Highlights, data |

---

Built with ❤️ for car dealers. `npm run dev` and you're racing.
