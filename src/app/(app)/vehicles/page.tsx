'use client';

import React from 'react';
import Link from 'next/link';
import { DealScoreRing, Badge, Button, Input, Select, Spinner } from '@/components/ui';
import { Car, Plus, Search, ChevronRight } from 'lucide-react';
import { fmt } from '@/lib/calculations';

const STATUS_CLASS: Record<string, string> = {
  found: 'status-found', evaluating: 'status-evaluating', bid_placed: 'status-bid_placed',
  won: 'status-won', transport: 'status-transport', prep: 'status-prep',
  ready: 'status-ready', listed: 'status-listed', sold: 'status-sold',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  React.useEffect(() => {
    fetch('/api/vehicles?limit=100')
      .then((r) => r.json())
      .then((d) => { setVehicles(d.vehicles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statuses = ['found', 'evaluating', 'bid_placed', 'won', 'transport', 'prep', 'ready', 'listed', 'sold'];
  const statusOpts = [
    { value: '', label: 'All statuses' },
    ...statuses.map((s) => ({ value: s, label: s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) })),
  ];

  const filtered = vehicles.filter((v) => {
    if (statusFilter && v.status !== statusFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!`${v.make} ${v.model} ${v.year} ${v.sourceName}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-gulf-orange" /> Vehicles
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{vehicles.length} vehicles in database</p>
        </div>
        <Button variant="primary" size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />} />
        </div>
        <Select options={statusOpts} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Score</th><th>Vehicle</th><th>Year</th><th>Km</th>
                  <th>Buy price</th><th>Profit</th><th>ROI</th><th>Status</th><th>Source</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="cursor-pointer">
                    <td><DealScoreRing score={v.dealScore ?? 0} size={36} /></td>
                    <td>
                      <Link href={`/vehicles/${v.id}`} className="hover:text-gulf-powder transition-colors">
                        <p className="font-medium text-slate-200">{v.make} {v.model}</p>
                        <p className="text-xs text-slate-600">{v.variant}</p>
                      </Link>
                    </td>
                    <td className="text-slate-400">{v.year}</td>
                    <td className="text-slate-400">{v.mileageKm?.toLocaleString()}</td>
                    <td className="font-medium text-slate-300">{fmt(v.buyPriceEur ?? 0)}</td>
                    <td>
                      <span className={(v.scenario?.normalProfitEur ?? 0) > 0 ? 'text-emerald-400 font-medium' : 'text-red-400'}>
                        {fmt(v.scenario?.normalProfitEur ?? 0)}
                      </span>
                    </td>
                    <td className="text-slate-400">{((v.scenario?.normalRoi ?? 0) * 100).toFixed(1)}%</td>
                    <td><span className={STATUS_CLASS[v.status ?? ''] ?? 'badge'}>{v.status}</span></td>
                    <td className="text-slate-600 text-xs">{v.sourceName}</td>
                    <td>
                      <Link href={`/vehicles/${v.id}`} className="btn-ghost p-1.5">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Car className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              No vehicles match your filters
            </div>
          )}
        </div>
      )}
    </div>
  );
}
