'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, Badge, DealScoreRing, Button, Card, Spinner } from '@/components/ui';
import {
  ArrowLeft, Car, BarChart2, FileText, Calculator, TrendingUp,
  Clock, AlertTriangle, CheckCircle, Download
} from 'lucide-react';
import { fmt, fmtPct, calcCompStats } from '@/lib/calculations';
import Link from 'next/link';

const TABS = [
  { id: 'source', label: 'Source', icon: <Car className="w-3.5 h-3.5" /> },
  { id: 'market', label: 'Market', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: 'tax', label: 'Tax & Reg', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'vat', label: 'VAT & Costs', icon: <Calculator className="w-3.5 h-3.5" /> },
  { id: 'profit', label: 'Profit & ROI', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'history', label: 'History', icon: <Clock className="w-3.5 h-3.5" /> },
];

const STATUS_FLOW = ['found', 'evaluating', 'bid_placed', 'won', 'transport', 'prep', 'ready', 'listed', 'sold'];

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = React.useState('source');
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function generatePDF() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'POST' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apexvalue-report-${id}.pdf`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!data?.vehicle) return (
    <div className="text-center py-16">
      <p className="text-slate-400">Vehicle not found</p>
      <Link href="/vehicles" className="text-gulf-powder hover:text-white text-sm mt-2 inline-block">← Back</Link>
    </div>
  );

  const { vehicle, costs, comps, taxRecord, scenario, history } = data;
  const compPrices = (comps ?? []).map((c: any) => c.priceEur);
  const stats = calcCompStats(compPrices);
  const rec = vehicle.dealScore >= 65 ? 'BUY' : vehicle.dealScore >= 40 ? 'CONSIDER' : 'DROP';
  const statusIdx = STATUS_FLOW.indexOf(vehicle.status);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="btn-ghost p-2 mt-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <Badge variant={rec === 'BUY' ? 'buy' : rec === 'CONSIDER' ? 'consider' : 'drop'}>
                {rec}
              </Badge>
              {vehicle.isDemo && <Badge variant="demo">Demo</Badge>}
            </div>
            <p className="text-slate-400 text-sm">
              {vehicle.variant} · {vehicle.mileageKm.toLocaleString()} km · {vehicle.fuelType} · {vehicle.gearbox}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Source: {vehicle.sourceName} ({vehicle.sourceCountry}) · Status: <span className="capitalize text-slate-400">{vehicle.status}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <DealScoreRing score={vehicle.dealScore ?? 0} size={60} />
          <Button variant="secondary" size="sm" onClick={generatePDF} loading={generating} className="gap-2">
            <Download className="w-4 h-4" />
            PDF Report
          </Button>
        </div>
      </div>

      {/* Pipeline progress */}
      <div className="card p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_FLOW.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex-shrink-0 flex flex-col items-center gap-1 px-2`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                  ${i < statusIdx ? 'bg-emerald-500 text-white' :
                    i === statusIdx ? 'bg-gulf-orange text-white' :
                    'bg-slate-700 text-slate-500'}`}>
                  {i < statusIdx ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <p className="text-xs text-slate-600 capitalize whitespace-nowrap">
                  {s.replace('_', ' ')}
                </p>
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className={`flex-1 h-0.5 min-w-4 ${i < statusIdx ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Tab content */}
      {tab === 'source' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Vehicle Details">
            <dl className="space-y-3">
              {[
                ['Make', vehicle.make], ['Model', vehicle.model], ['Variant', vehicle.variant || '–'],
                ['Year', vehicle.year], ['Mileage', `${vehicle.mileageKm.toLocaleString()} km`],
                ['Fuel', vehicle.fuelType], ['Gearbox', vehicle.gearbox],
                ['Color', vehicle.color || '–'], ['VIN', vehicle.vin || '–'],
                ['License plate', vehicle.licensePlate || '–'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-200 font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Purchase Info">
            <dl className="space-y-3">
              {[
                ['Source', vehicle.sourceName || '–'],
                ['Source country', vehicle.sourceCountry || '–'],
                ['Buy price', fmt(vehicle.buyPriceEur ?? 0)],
                ['Auction fee', fmt(vehicle.auctionFeeEur ?? 0)],
                ['Total buy incl. fee', fmt((vehicle.buyPriceEur ?? 0) + (vehicle.auctionFeeEur ?? 0))],
                ['Target market', vehicle.targetMarket || 'DK'],
                ['Source URL', vehicle.sourceUrl || '–'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-200 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}

      {tab === 'market' && (
        <div className="space-y-4">
          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Comps', value: stats.count },
              { label: 'Median', value: fmt(stats.median) },
              { label: 'P25', value: fmt(stats.p25) },
              { label: 'P75', value: fmt(stats.p75) },
            ].map(({ label, value }) => (
              <div key={label} className="card p-4 text-center">
                <p className="text-xl font-bold text-gulf-powder">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Buy price vs market */}
          <Card title="Buy price vs market">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 h-3 bg-slate-800 rounded-full relative overflow-hidden">
                {stats.count > 0 && (() => {
                  const range = stats.max - stats.min || 1;
                  const p25pct = ((stats.p25 - stats.min) / range) * 100;
                  const p75pct = ((stats.p75 - stats.min) / range) * 100;
                  const buypct = (((vehicle.buyPriceEur ?? 0) - stats.min) / range) * 100;
                  return <>
                    <div className="absolute inset-y-0 bg-gulf-powder/10 rounded-full" style={{ left: `${p25pct}%`, right: `${100 - p75pct}%` }} />
                    <div className="absolute inset-y-0 w-1 bg-gulf-orange rounded-full" style={{ left: `${Math.min(99, Math.max(0, buypct))}%` }} />
                  </>;
                })()}
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {((vehicle.buyPriceEur ?? 0) / stats.median * 100 - 100).toFixed(1)}% vs median
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Range: {fmt(stats.min)} – {fmt(stats.max)} · Std dev: {fmt(stats.stdDev)}
            </p>
          </Card>

          {/* Comps table */}
          <Card title={`Market Comparables (${comps?.length ?? 0})`}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Make / Model</th><th>Year</th><th>Km</th>
                    <th>Price</th><th>Market</th><th>Source</th><th>Days</th>
                  </tr>
                </thead>
                <tbody>
                  {(comps ?? []).map((c: any) => (
                    <tr key={c.id}>
                      <td className="text-slate-300">{c.make} {c.model}</td>
                      <td>{c.year}</td>
                      <td>{c.mileageKm?.toLocaleString()}</td>
                      <td className="font-semibold text-gulf-powder">{fmt(c.priceEur)}</td>
                      <td>{c.market}</td>
                      <td className="text-slate-500">{c.source}</td>
                      <td className="text-slate-500">{c.daysOnMarket ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'tax' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Registration Tax (DK)" subtitle={taxRecord?.isEstimated ? 'Estimated – not official' : 'Official calculation'}>
            {taxRecord ? (
              <dl className="space-y-3">
                {[
                  ['Market', taxRecord.market],
                  ['Scheme', taxRecord.scheme || '–'],
                  ['Reg. tax (EUR)', fmt(taxRecord.registrationTaxEur ?? 0)],
                  ['Reg. tax (DKK)', `${((taxRecord.registrationTaxLocal ?? 0)).toLocaleString('da-DK')} DKK`],
                  ['VAT scheme', taxRecord.vatScheme || '–'],
                  ['Source', taxRecord.source === 'asg' ? 'ASG Digital (official)' : taxRecord.source === 'estimated' ? '⚠️ Estimated' : 'Manual'],
                  ['Calculated', new Date(taxRecord.calculatedAt ?? '').toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-slate-200 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="text-center py-6">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No tax record yet</p>
                <p className="text-xs text-slate-600 mt-1">Connect ASG Digital in Settings for official calc</p>
              </div>
            )}
          </Card>
          <Card title="ASG Digital Integration" subtitle="Connect in Settings → APIs">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs">
                ⚠️ Demo Mode: Registration tax is estimated. Connect ASG Digital API for official Danish tax calculations.
              </div>
              <Link href="/settings?tab=apis" className="btn-secondary text-sm block text-center">
                Connect ASG Digital →
              </Link>
            </div>
          </Card>
        </div>
      )}

      {tab === 'vat' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Cost Breakdown">
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-1.5 border-b border-white/5">
                <span className="text-slate-400">Buy price</span>
                <span className="text-slate-200 font-medium">{fmt(vehicle.buyPriceEur ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-b border-white/5">
                <span className="text-slate-400">Auction fee</span>
                <span className="text-slate-200">{fmt(vehicle.auctionFeeEur ?? 0)}</span>
              </div>
              {(costs ?? []).map((c: any) => (
                <div key={c.id} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                  <span className="text-slate-400 capitalize">{c.label}</span>
                  <span className={c.included ? 'text-slate-200' : 'text-slate-600 line-through'}>{fmt(c.amountEur)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-2 border-t border-gulf-powder/20 mt-2">
                <span className="font-semibold text-slate-200">Total Cost</span>
                <span className="font-bold text-gulf-powder text-base">{fmt(scenario?.totalCostEur ?? 0)}</span>
              </div>
            </div>
          </Card>
          <Card title="VAT Scheme" subtitle={taxRecord?.vatScheme || 'Unknown'}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'margin', name: 'Margin Scheme' },
                  { label: 'reverse_charge', name: 'EU Reverse Charge' },
                  { label: 'standard', name: 'Standard 25%' },
                  { label: 'private', name: 'Private Purchase' },
                ].map((s) => (
                  <div key={s.label}
                    className={`p-3 rounded-lg border text-xs text-center cursor-default
                      ${taxRecord?.vatScheme === s.label
                        ? 'border-gulf-orange/50 bg-gulf-orange/10 text-gulf-orange'
                        : 'border-white/10 bg-white/5 text-slate-500'}`}>
                    {s.name}
                  </div>
                ))}
              </div>
              {taxRecord?.capitalBindingIndicator && (
                <div className={`p-3 rounded-lg text-sm text-center font-medium
                  ${taxRecord.capitalBindingIndicator === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    taxRecord.capitalBindingIndicator === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  Capital binding: {taxRecord.capitalBindingIndicator}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'profit' && (
        <div className="space-y-6">
          {scenario ? (
            <>
              {/* Scenarios */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: 'Conservative', sell: scenario.conservativeSellEur, profit: scenario.conservativeProfitEur, roi: scenario.conservativeRoi, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
                  { label: 'Normal', sell: scenario.normalSellEur, profit: scenario.normalProfitEur, roi: scenario.normalRoi, color: 'text-gulf-powder', bg: 'bg-gulf-blue/20 border-gulf-blue/40' },
                  { label: 'Optimistic', sell: scenario.optimisticSellEur, profit: scenario.optimisticProfitEur, roi: scenario.optimisticRoi, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                ].map(({ label, sell, profit, roi, color, bg }) => (
                  <div key={label} className={`card p-5 border ${bg}`}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{label} Scenario</p>
                    <p className="text-sm text-slate-400">Sell price</p>
                    <p className={`text-xl font-bold ${color} mb-2`}>{fmt(sell ?? 0)}</p>
                    <p className="text-sm text-slate-400">Profit</p>
                    <p className={`text-lg font-semibold ${(profit ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt(profit ?? 0)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">ROI: {fmtPct(roi ?? 0)}</p>
                  </div>
                ))}
              </div>

              {/* Max bid strategies */}
              <Card title="Max Bid Strategies">
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: 'Safe', value: scenario.maxBidSafe, desc: 'Conservative sell – €2,000 buffer', color: 'text-amber-400' },
                    { label: 'Balanced', value: scenario.maxBidBalanced, desc: 'Normal sell – €1,000 buffer', color: 'text-gulf-powder' },
                    { label: 'Aggressive', value: scenario.maxBidAggressive, desc: 'Optimistic sell – €500 buffer', color: 'text-emerald-400' },
                  ].map(({ label, value, desc, color }) => (
                    <div key={label} className="text-center p-4 bg-white/5 rounded-xl">
                      <p className="text-xs text-slate-500 mb-2">{label}</p>
                      <p className={`text-2xl font-bold ${color}`}>{fmt(value ?? 0)}</p>
                      <p className="text-xs text-slate-600 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Break-even">
                <p className="text-2xl font-bold text-white">{fmt(scenario.breakEvenEur ?? 0)}</p>
                <p className="text-sm text-slate-500 mt-1">Minimum sell price to cover all costs</p>
              </Card>
            </>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-slate-400">No profit scenario calculated yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <Card title="Notes & History">
          <div className="space-y-3">
            {vehicle.notes && (
              <div className="p-3 bg-white/5 rounded-lg text-sm text-slate-300 border border-white/10">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                {vehicle.notes}
              </div>
            )}
            {(history ?? []).map((h: any) => (
              <div key={h.id} className="flex items-start gap-3 py-2 border-b border-white/5">
                <div className="w-2 h-2 rounded-full bg-gulf-powder/30 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-300">{h.content}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{new Date(h.createdAt ?? '').toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(history ?? []).length === 0 && !vehicle.notes && (
              <p className="text-center text-slate-500 text-sm py-4">No history yet</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
