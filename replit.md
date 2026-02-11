# ApexValue - B2B Car Trading & Valuation SaaS

## Overview
ApexValue is a multi-tenant B2B car trading and valuation platform with Gulf Racing-inspired design. It provides importers and dealers with tools for vehicle valuation, market analysis, deal scoring, financial calculations, and pipeline management across 8 European markets.

## Recent Changes
- 2026-02-11: Initial MVP build - complete frontend and backend with 15 demo vehicles, market comps, cost templates, auth integration, financial calculations
- Gulf Racing theme: Powder Blue (#B9D9EB), Orange (#FF6319), Dark Blue (#002776)
- Demo Mode accessible without authentication

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)
- **Storage**: Cloudflare R2 (feature-flagged, ready for activation)

## Key Files
- `shared/schema.ts` - Database models (organizations, vehicles, marketComps, costTemplates, events)
- `shared/models/auth.ts` - Auth models (users, sessions)
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database storage layer (DatabaseStorage)
- `server/seed.ts` - Demo data seeding (15 vehicles, comps, 8 cost templates)
- `client/src/App.tsx` - Main app with routing and layout
- `client/src/lib/calculations.ts` - Financial calculations (TotalCost, Profit, ROI, MaxBid, DealScore)
- `client/src/lib/i18n.ts` - Internationalization (English + Danish)

## Pages
- `/landing` - Marketing landing page
- `/` - Dashboard Cockpit (KPIs, hot deals, risk vehicles)
- `/auction-finder` - Vehicle search with filters and deal categorization
- `/vehicle/:id` - Vehicle detail with 6 tabs (Source, Market, Tax, Costs, Profit, Notes)
- `/pipeline` - Pipeline management with status workflow
- `/vat-tax` - VAT & Tax Center with country templates
- `/cost-templates` - Cost template management
- `/reports` - PDF reports archive
- `/settings` - Profile, organization, integrations, storage

## User Preferences
- Dark mode by default
- Gulf Racing cockpit aesthetic
- Data-first, compact card layouts
- DKK as primary display currency for DK market
