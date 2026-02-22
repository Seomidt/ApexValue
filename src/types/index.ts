// ─── Shared types ─────────────────────────────────────────────────────────────
export type Plan = 'free' | 'pro' | 'team';
export type Role = 'superadmin' | 'orgadmin' | 'user' | 'viewer';
export type VehicleStatus = 'found' | 'evaluating' | 'bid_placed' | 'won' | 'transport' | 'prep' | 'ready' | 'listed' | 'sold';
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'other';
export type Gearbox = 'auto' | 'manual';
export type VATScheme = 'margin' | 'reverse_charge' | 'standard' | 'private';
export type Market = 'DK' | 'DE' | 'NL' | 'SE' | 'NO' | 'PL' | 'BE' | 'FR';
export type Recommendation = 'BUY' | 'CONSIDER' | 'DROP';
