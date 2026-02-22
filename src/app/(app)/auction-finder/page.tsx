'use client';

import React from 'react';
import Link from 'next/link';
import { DealScoreRing, Badge, Button, Input, Select, KPICard, Spinner } from '@/components/ui';
import { Search, Filter, Flame, AlertTriangle, ThumbsUp, RefreshCw, Car } from 'lucide-react';
import { fmt } from '@/lib/calculations';

interface Vehicle {
  id: string; make: string; model: string; variant?: string; year: number;
  mileageKm: number; fuelType?: string; gearbox?: string; buyPriceEur: number;
  auctionFeeEur?: number; sourceName?: string; sourceCountry?: string;
  dealScore: number; status: string;
  scenario?: { normalProfitEur: number; normalRoi: number; maxBidBalanced: number; totalCostEur: number };
  riskBadges?: string[];
}

const FUEL_OPTS = [
  { value: '', label: 'All fuels' }, { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' }, { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric' },
];
const GEAR_OPTS = [{ value: '', label: 'All gearboxes' }, { value: 'auto', label: 'Automatic' }, { value: 'manual', label: 'Manual' }];

export default function AuctionFinderPage() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    minPrice: '', maxPrice: '', minProfit: '', minROI: '',
    yearFrom: '', yearTo: '', maxKm: '', fuel: '', gearbox: '', query: '',
  });

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [k]: e.target.value }));

  React.useEffect(() => {
    setLoading(true);
    fetch('/api/vehicles?limit=80')
      .then((r) => r.json())
      .then((data) => { setVehicles(data.vehicles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter((v) => {
    if (filters.minPrice && v.buyPriceEur < Number(filters.minPrice)) return false;
    if (filters.maxPrice && v.buyPriceEur > Number(filters.maxPrice)) return false;
    if (filters.minProfit && (v.scenario?.normalProfitEur ?? 0) < Number(filters.minProfit)) return false;
    if (filters.minROI && (v.scenario?.normalRoi ?? 0) < Number(filters.minROI) / 100) return false;
    if (filters.yearFrom && v.year < Number(filters.yearFrom)) return false;
    if (filters.yearTo && v.year > Number(filters.yearTo)) return false;
    if (filters.maxKm && v.mileageKm > Number(filters.maxKm)) return false;
    if (filters.fuel && v.fuelType !== filters.fuel) return false;
    if (filters.gearbox && v.gearbox !== filters.gearbox) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (!`${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hot = filtered.filter((v) => v.dealScore >= 65);
  const consider = filtered.filter((v) => v.dealScore >= 40 && v.dealScore < 65);
  const risk = filtered.filter((v) => v.dealScore < 40);

  const RISK_LABELS: Record<string, string> = {
    HIGH_PRICE: 'Above market', LOW_COMPS: 'Low comps', LOSS_RISK: 'Loss risk',
    TAX_MISSING: 'Tax ?', VAT_UNKNOWN: 'VAT ?', HIGH_KM: 'High km',
    DAMAGE_RISK: 'Damage', HIGH_CAPITAL_BINDING: 'High capital bind',
    MEDIUM_CAPITAL_BINDING: 'Med capital bind',
  };

  function VehicleCard({ v }: { v: Vehicle }) {
    const rec = v.dealScore >= 65 ? 'BUY' : v.dealScore >= 40 ? 'CONSIDER' : 'DROP';
    return (
      <Link href={`/vehicles/${v.id}`}
        className="card hover:border-gulf-powder/20 transition-all duration-200 block group">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <DealScoreRing score={v.dealScore} size={48} />
              <div>
                <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {v.year} {v.make} {v.model}
                </p>
                <p className="text-xs text-slate-500">{v.variant}</p>
              </div>
            </div>
            <Badge variant={rec === 'BUY' ? 'buy' : rec === 'CONSIDER' ? 'consider' : 'drop'}>
              {rec}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-600">Buy price</p>
              <p className="font-semibold text-slate-300">{fmt(v.buyPriceEur)}</p>
            </div>
            <div>
              <p className="text-slate-600">Profit (normal)</p>
              <p className={`font-semibold ${(v.scenario?.normalProfitEur ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt(v.scenario?.normalProfitEur ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-slate-600">ROI</p>
              <p className="font-semibold text-slate-300">{((v.scenario?.normalRoi ?? 0) * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-600">Max bid (balanced)</p>
              <p className="font-medium text-gulf-powder">{fmt(v.scenario?.maxBidBalanced ?? 0)}</p>
            </div>
            <div>
              <p className="text-slate-600">Total cost</p>
              <p className="font-medium text-slate-400">{fmt(v.scenario?.totalCostEur ?? 0)}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <span className="badge bg-slate-700/40 text-slate-500 border border-slate-600/30">
              {v.mileageKm.toLocaleString()} km
            </span>
            <span className="badge bg-slate-700/40 text-slate-500 border border-slate-600/30 capitalize">
              {v.fuelType}
            </span>
            <span className="badge bg-slate-700/40 text-slate-500 border border-slate-600/30 capitalize">
              {v.gearbox}
            </span>
            <span className="badge bg-slate-700/40 text-slate-500 border border-slate-600/30">
              {v.sourceName} · {v.sourceCountry}
            </span>
            {(v.riskBadges ?? []).slice(0, 2).map((b) => (
              <span key={b} className="badge-risk">{RISK_LABELS[b] ?? b}</span>
            ))}
          </div>
        </div>
      </Link>
    );
  }

  function Group({ title, icon, items, color }: {
    title: string; icon: React.ReactNode; items: Vehicle[]; color: string;
  }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-semibold text-slate-200">{title}</h2>
          <span className={`badge ${color}`}>{items.length}</span>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((v) => <VehicleCard key={v.id} v={v} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-gulf-orange" />
            Auction Finder
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Demo Mode – sample auction vehicles</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="demo">Demo data</Badge>
          <Button variant="secondary" size="sm" onClick={() => {}} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Hot Deals" value={hot.length} color="orange" icon={<Flame className="w-4 h-4" />} />
        <KPICard label="Consider" value={consider.length} color="default" icon={<ThumbsUp className="w-4 h-4" />} />
        <KPICard label="Risk" value={risk.length} color="red" icon={<AlertTriangle className="w-4 h-4" />} />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-medium text-slate-400">Filters</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <div className="xl:col-span-2">
            <Input placeholder="Search make, model..." value={filters.query} onChange={setF('query')} icon={<Search className="w-4 h-4" />} />
          </div>
          <Input placeholder="Min price €" type="number" value={filters.minPrice} onChange={setF('minPrice')} />
          <Input placeholder="Max price €" type="number" value={filters.maxPrice} onChange={setF('maxPrice')} />
          <Input placeholder="Min profit €" type="number" value={filters.minProfit} onChange={setF('minProfit')} />
          <Input placeholder="Min ROI %" type="number" value={filters.minROI} onChange={setF('minROI')} />
          <Input placeholder="Year from" type="number" value={filters.yearFrom} onChange={setF('yearFrom')} />
          <Input placeholder="Year to" type="number" value={filters.yearTo} onChange={setF('yearTo')} />
          <Input placeholder="Max km" type="number" value={filters.maxKm} onChange={setF('maxKm')} />
          <Select options={FUEL_OPTS} value={filters.fuel} onChange={setF('fuel')} />
          <Select options={GEAR_OPTS} value={filters.gearbox} onChange={setF('gearbox')} />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-8">
          <Group title="Hot Deals" icon={<Flame className="w-4 h-4 text-gulf-orange" />} items={hot} color="badge-hot" />
          <Group title="Consider" icon={<ThumbsUp className="w-4 h-4 text-amber-400" />} items={consider} color="badge-consider" />
          <Group title="Risk" icon={<AlertTriangle className="w-4 h-4 text-red-400" />} items={risk} color="badge-risk" />
          {filtered.length === 0 && (
            <div className="card p-16 text-center">
              <Car className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No vehicles match your filters</p>
              <p className="text-slate-600 text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
