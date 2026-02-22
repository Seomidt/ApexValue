'use client';

import React from 'react';
import { Card, Select, Button } from '@/components/ui';
import { Calculator, Info } from 'lucide-react';
import { calcVATScheme, fmt } from '@/lib/calculations';

type Scheme = 'margin' | 'reverse_charge' | 'standard' | 'private';

const SCHEMES: { value: Scheme; label: string; desc: string }[] = [
  { value: 'margin', label: 'Margin Scheme', desc: 'VAT only on profit margin. Ideal for used vehicles bought without VAT.' },
  { value: 'reverse_charge', label: 'EU Reverse Charge', desc: 'B2B cross-border. No VAT on purchase or sale. Best for export dealers.' },
  { value: 'standard', label: 'Standard (DK 25%)', desc: 'Full VAT: reclaim input VAT, charge 25% on sales. Good for VAT-registered buyers.' },
  { value: 'private', label: 'Private Purchase', desc: 'Bought from private seller. No input VAT to reclaim. 25% on full sale.' },
];

export default function VATCenterPage() {
  const [scheme, setScheme] = React.useState<Scheme>('margin');
  const [buyPrice, setBuyPrice] = React.useState(15000);
  const [sellPrice, setSellPrice] = React.useState(22000);

  const result = calcVATScheme(scheme, buyPrice, sellPrice);

  const schemeInfo = SCHEMES.find((s) => s.value === scheme);

  const rows = [
    { label: 'Buy price (ex. VAT)', value: fmt(result.buyPrice), highlight: false },
    { label: 'Input VAT (purchase)', value: fmt(result.buyVAT), highlight: false },
    { label: 'Sell price (ex. VAT)', value: fmt(result.sellPrice), highlight: false },
    { label: 'Output VAT (sale)', value: fmt(result.sellVAT), highlight: false },
    result.margin > 0 ? { label: 'Margin', value: fmt(result.margin), highlight: false } : null,
    result.vatOnMargin > 0 ? { label: 'VAT on margin', value: fmt(result.vatOnMargin), highlight: false } : null,
    result.vatReturn > 0 ? { label: 'VAT reclaim', value: `–${fmt(result.vatReturn)}`, highlight: false } : null,
    { label: 'Net VAT payable', value: fmt(result.netVATPayable), highlight: true },
    { label: 'Capital binding (VAT cash)', value: fmt(result.capitalBindingEur), highlight: false },
  ].filter(Boolean) as { label: string; value: string; highlight: boolean }[];

  const capitalColor = result.capitalBinding === 'high' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                       result.capitalBinding === 'medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                       'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-gulf-orange" />
          VAT Center
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Model VAT schemes for European car trading</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          {/* Scheme selector */}
          <div className="card p-4 space-y-3">
            <h2 className="font-semibold text-slate-200">VAT Scheme</h2>
            <div className="grid grid-cols-2 gap-2">
              {SCHEMES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScheme(s.value)}
                  className={`p-3 rounded-lg border text-left text-xs transition-all
                    ${scheme === s.value
                      ? 'border-gulf-orange/60 bg-gulf-orange/10 text-gulf-orange'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'}`}
                >
                  <p className="font-semibold mb-0.5">{s.label}</p>
                </button>
              ))}
            </div>
            {schemeInfo && (
              <div className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg text-xs text-slate-400">
                <Info className="w-3.5 h-3.5 text-gulf-powder/50 flex-shrink-0 mt-0.5" />
                {schemeInfo.desc}
              </div>
            )}
          </div>

          {/* Inputs */}
          <div className="card p-4 space-y-4">
            <h2 className="font-semibold text-slate-200">Prices</h2>
            <div>
              <label className="label">Buy price (excl. VAT) €</label>
              <input
                type="number"
                className="input"
                value={buyPrice}
                onChange={(e) => setBuyPrice(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label className="label">Sell price (excl. VAT) €</label>
              <input
                type="number"
                className="input"
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-4">
          <Card title="VAT Breakdown" subtitle={`${schemeInfo?.label} · DK 25% VAT rate`}>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.label}
                  className={`flex justify-between text-sm py-2 ${row.highlight
                    ? 'border-t border-gulf-orange/20 pt-3 mt-1 font-bold text-base'
                    : 'border-b border-white/5'}`}>
                  <span className={row.highlight ? 'text-slate-200' : 'text-slate-400'}>{row.label}</span>
                  <span className={row.highlight ? 'text-gulf-orange' : 'text-slate-200'}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Capital binding indicator */}
          <div className={`card p-4 border ${capitalColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Capital Binding</p>
                <p className="text-lg font-bold capitalize">{result.capitalBinding}</p>
                <p className="text-xs mt-1 text-slate-400">
                  {fmt(result.capitalBindingEur)} tied up in VAT cash
                </p>
              </div>
              <div className="text-3xl">
                {result.capitalBinding === 'minimal' ? '✅' : result.capitalBinding === 'medium' ? '⚠️' : '🔴'}
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {result.capitalBinding === 'minimal' && 'Low VAT cash requirement. Good for cash flow.'}
              {result.capitalBinding === 'medium' && 'Moderate VAT tied up. Consider timing of reclaim.'}
              {result.capitalBinding === 'high' && 'Significant VAT tied up in purchase. Plan cash flow carefully.'}
            </div>
          </div>

          {/* Summary box */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Gross margin</p>
                <p className="font-semibold text-white">{fmt(sellPrice - buyPrice)}</p>
              </div>
              <div>
                <p className="text-slate-500">Net VAT cost</p>
                <p className={`font-semibold ${result.netVATPayable > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {fmt(result.netVATPayable)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Net profit (after VAT)</p>
                <p className="font-semibold text-gulf-powder">{fmt(sellPrice - buyPrice - result.netVATPayable)}</p>
              </div>
              <div>
                <p className="text-slate-500">Effective VAT burden</p>
                <p className="font-semibold text-slate-300">
                  {(buyPrice + sellPrice) > 0 ? ((result.netVATPayable / (sellPrice || 1)) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scheme comparison */}
      <Card title="Scheme Comparison" subtitle="Same prices across all 4 schemes">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scheme</th><th>Buy VAT</th><th>Sell VAT</th><th>Net VAT payable</th><th>Capital binding</th><th>Best for</th>
              </tr>
            </thead>
            <tbody>
              {SCHEMES.map((s) => {
                const r = calcVATScheme(s.value, buyPrice, sellPrice);
                return (
                  <tr key={s.value} className={scheme === s.value ? 'bg-gulf-orange/5' : ''}>
                    <td className="font-medium text-slate-200">{s.label}</td>
                    <td>{fmt(r.buyVAT)}</td>
                    <td>{fmt(r.sellVAT)}</td>
                    <td className={r.netVATPayable > 0 ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>{fmt(r.netVATPayable)}</td>
                    <td className={`capitalize ${r.capitalBinding === 'high' ? 'text-red-400' : r.capitalBinding === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {r.capitalBinding}
                    </td>
                    <td className="text-slate-500 text-xs">{s.desc.split('.')[0]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="text-xs text-slate-600 text-center">
        ⚠️ This calculator is for estimation purposes only. Consult a tax advisor for official VAT guidance.
      </div>
    </div>
  );
}
