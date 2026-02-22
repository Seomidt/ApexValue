'use client';

import React from 'react';
import Link from 'next/link';
import { DealScoreRing, Badge, Spinner } from '@/components/ui';
import { GitBranch, CheckSquare } from 'lucide-react';
import { fmt } from '@/lib/calculations';

const STAGES = [
  { id: 'found', label: 'Found', color: 'bg-slate-500/20 border-slate-500/30' },
  { id: 'evaluating', label: 'Evaluating', color: 'bg-blue-500/20 border-blue-500/30' },
  { id: 'bid_placed', label: 'Bid Placed', color: 'bg-purple-500/20 border-purple-500/30' },
  { id: 'won', label: 'Won', color: 'bg-emerald-600/20 border-emerald-600/30' },
  { id: 'transport', label: 'Transport', color: 'bg-cyan-500/20 border-cyan-500/30' },
  { id: 'prep', label: 'Prep', color: 'bg-amber-500/20 border-amber-500/30' },
  { id: 'ready', label: 'Ready', color: 'bg-lime-500/20 border-lime-500/30' },
  { id: 'listed', label: 'Listed', color: 'bg-gulf-orange/20 border-gulf-orange/30' },
  { id: 'sold', label: 'Sold', color: 'bg-emerald-500/20 border-emerald-500/30' },
];

const BILINFO_CHECKLIST = [
  'Main photo uploaded (min 800x600)',
  'All specs filled (year, km, fuel, gear)',
  'VIN / license plate entered',
  'Price set in DKK',
  'Description written (DA)',
  'Registration tax confirmed',
  'No damage notes pending',
  'Dealer contact info up to date',
];

export default function PipelinePage() {
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [checklist, setChecklist] = React.useState<boolean[]>(BILINFO_CHECKLIST.map(() => false));

  React.useEffect(() => {
    fetch('/api/vehicles?limit=100')
      .then((r) => r.json())
      .then((d) => { setVehicles(d.vehicles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const byStatus = (status: string) => vehicles.filter((v) => v.status === status);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-gulf-orange" /> Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{vehicles.filter(v => v.status !== 'sold').length} active · {vehicles.filter(v => v.status === 'sold').length} sold</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CheckSquare className="w-4 h-4" />
          Bilinfo checklist available on each vehicle
        </div>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const items = byStatus(stage.id);
            return (
              <div key={stage.id} className="w-56 flex-shrink-0">
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-b border-x border-t ${stage.color} mb-2`}>
                  <span className="text-xs font-semibold text-slate-300">{stage.label}</span>
                  <span className="text-xs font-bold text-slate-400">{items.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {items.map((v) => (
                    <Link key={v.id} href={`/vehicles/${v.id}`}
                      className="block card p-3 hover:border-gulf-powder/20 transition-all group">
                      <div className="flex items-start gap-2">
                        <DealScoreRing score={v.dealScore ?? 0} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                            {v.year} {v.make}
                          </p>
                          <p className="text-xs text-slate-600 truncate">{v.model}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-slate-600">{v.mileageKm?.toLocaleString()} km</span>
                        <span className={`font-medium ${(v.scenario?.normalProfitEur ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmt(v.scenario?.normalProfitEur ?? 0)}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <div className="py-4 text-center text-xs text-slate-700">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bilinfo Checklist helper */}
      <div className="card p-6 max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-4 h-4 text-gulf-orange" />
          <h2 className="font-semibold text-slate-200">Ready for Bilinfo Checklist</h2>
        </div>
        <div className="space-y-2">
          {BILINFO_CHECKLIST.map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checklist[i]}
                onChange={() => setChecklist((c) => { const n = [...c]; n[i] = !n[i]; return n; })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-gulf-orange accent-gulf-orange"
              />
              <span className={`text-sm transition-colors ${checklist[i] ? 'line-through text-slate-600' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {item}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{checklist.filter(Boolean).length} / {BILINFO_CHECKLIST.length} complete</span>
            {checklist.every(Boolean) && (
              <Badge variant="buy">✓ Ready for Bilinfo</Badge>
            )}
          </div>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gulf-orange rounded-full transition-all"
              style={{ width: `${(checklist.filter(Boolean).length / BILINFO_CHECKLIST.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
