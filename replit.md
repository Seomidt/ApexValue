# ApexValue - B2B Car Trading & Valuation SaaS

## Overview
ApexValue is a multi-tenant B2B car trading and valuation platform with Gulf Racing-inspired design. It provides importers and dealers with tools for vehicle valuation, market analysis, deal scoring, financial calculations, and pipeline management across 8 European markets.

## Recent Changes
- 2026-02-11: Initial MVP build - complete frontend and backend with 38 demo vehicles, 500+ market comps, 11 cost templates, auth integration, financial calculations
- 2026-02-11: Added Compare Models page (2-5 vehicle side-by-side comparison)
- 2026-02-11: Added SuperAdmin panel with org management, usage analytics
- 2026-02-11: Added PDF report generation (jsPDF) with analytics dashboard
- 2026-02-11: Added Demo/Live mode toggle with BYOK settings (8 API connectors) + Test Forbindelse (API connection testing)
- 2026-02-11: Enhanced Dashboard with Danish UI, Auction Finder with full filters, Pipeline management
- Gulf Racing theme: Powder Blue (#B9D9EB), Orange (#FF6319), Dark Blue (#002776)
- Demo Mode accessible without authentication

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)
- **PDF**: jsPDF for client-side report generation
- **Storage**: Cloudflare R2 (feature-flagged, ready for activation)

## Key Files
- `shared/schema.ts` - Database models (organizations, vehicles, marketComps, costTemplates, events)
- `shared/models/auth.ts` - Auth models (users, sessions)
- `server/routes.ts` - API endpoints (vehicles CRUD, comps, templates, events, stats)
- `server/storage.ts` - Database storage layer (DatabaseStorage)
- `server/seed.ts` - Demo data seeding (38 vehicles, 500+ comps, 11 cost templates)
- `client/src/App.tsx` - Main app with routing, layout, ModeContext (demo/live)
- `client/src/lib/calculations.ts` - Financial calculations (TotalCost, Profit, ROI, MaxBid, DealScore)
- `client/src/lib/i18n.ts` - Internationalization (English + Danish)
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/components/deal-score-badge.tsx` - DealScore and Recommendation badges

## Pages
- `/landing` - Marketing landing page
- `/` - Dashboard Cockpit (KPIs, hot deals, risk vehicles, Find Bil search, Profit Calculator)
- `/auction-finder` - Vehicle search with filters, sorting, deal categorization (Hot/Consider/Risk)
- `/vehicle/:id` - Vehicle detail with 6 tabs (Source, Market, Tax, Costs, Profit, Notes)
- `/pipeline` - Pipeline management with status workflow and dropdown controls
- `/compare` - Compare Models (2-5 vehicles side-by-side, best-value highlighting)
- `/vat-tax` - VAT & Tax Center with country templates
- `/cost-templates` - Cost template management
- `/reports` - Reports & Analytics (PDF generation, portfolio analytics, top performers)
- `/admin` - SuperAdmin Panel (org management, usage analytics, distribution charts)
- `/settings` - Profile, organization, BYOK integrations (8 API connectors), storage

## User Preferences
- Dark mode by default
- Gulf Racing cockpit aesthetic
- Data-first, compact card layouts
- DKK as primary display currency for DK market
