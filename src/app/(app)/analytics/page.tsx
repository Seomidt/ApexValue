'use client';

import React from 'react';
import { KPICard, Card, Spinner } from '@/components/ui';
import { BarChart3, Users, Globe, TrendingUp, Activity } from 'lucide-react';

const COUNTRIES = ['DK', 'DE', 'NL', 'SE', 'NO', 'PL', 'BE', 'FR'];
const COUNTRY_FLAGS: Record<string, string> = { DK: '🇩🇰', DE: '🇩🇪', NL: '🇳🇱', SE: '🇸🇪', NO: '🇳🇴', PL: '🇵🇱', BE: '🇧🇪', FR: '🇫🇷' };
const FUNNEL = [
  { label: 'Page visits', value: 847, pct: 100 },
  { label: 'Signups', value: 124, pct: 14.6 },
  { label: 'First vehicle', value: 87, pct: 10.3 },
  { label: 'First comps fetch', value: 62, pct: 7.3 },
  { label: 'First PDF report', value: 41, pct: 4.8 },
];
const FEATURES = [
  { name: 'Dashboard', usage: 97 },
  { name: 'Auction Finder', usage: 89 },
  { name: 'VAT Center', usage: 72 },
  { name: 'Pipeline', usage: 65 },
  { name: 'Vehicle Detail', usage: 84 },
  { name: 'PDF Reports', usage: 43 },
  { name: 'Settings / APIs', usage: 31 },
];

export default function AnalyticsPage() {
  const [online, setOnline] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/analytics/dashboard')
      .then((r) => r.json())
      .then((d) => { setOnline(d.online ?? []); setLoading(false); })
      .catch(() => setLoading(false));

    const interval = setInterval(() => {
      fetch('/api/analytics/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: '/analytics' }) }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Demo country data
  const countryData = COUNTRIES.map((c) => ({
    country: c,
    flag: COUNTRY_FLAGS[c],
    visits: Math.floor(Math.random() * 200) + 10,
    signups: Math.floor(Math.random() * 30),
    active: Math.floor(Math.random() * 5),
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-gulf-orange" /> Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Internal analytics — demo data shown</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Online now" value={online.length || 3} icon={<Activity className="w-4 h-4" />} color="green" sub="Active in last 60s" />
        <KPICard label="Total users" value="124" icon={<Users className="w-4 h-4" />} color="powder" />
        <KPICard label="Countries" value="8" icon={<Globe className="w-4 h-4" />} color="default" />
        <KPICard label="30d events" value="4,821" icon={<TrendingUp className="w-4 h-4" />} color="default" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Realtime online */}
        <Card title="Realtime – Online Now" subtitle="Users active in the last 60 seconds">
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : online.length > 0 ? (
              online.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                    <span className="text-sm text-slate-300">{u.page || '/dashboard'}</span>
                  </div>
                  <span className="text-xs text-slate-500">{COUNTRY_FLAGS[u.country ?? 'DK'] ?? '🌍'} {u.country || 'DK'}</span>
                </div>
              ))
            ) : (
              // Demo data when none available
              [
                { page: '/dashboard', country: 'DK' },
                { page: '/auction-finder', country: 'DE' },
                { page: '/vat-center', country: 'NL' },
              ].map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                    <span className="text-sm text-slate-300">{u.page}</span>
                  </div>
                  <span className="text-xs text-slate-500">{COUNTRY_FLAGS[u.country]} {u.country}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Conversion funnel */}
        <Card title="Conversion Funnel" subtitle="Last 30 days">
          <div className="space-y-3">
            {FUNNEL.map((step, i) => (
              <div key={step.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{step.label}</span>
                  <span className="text-slate-300 font-medium">{step.value} <span className="text-slate-600">({step.pct}%)</span></span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${i === 0 ? 'bg-gulf-powder' : i === 1 ? 'bg-gulf-orange' : 'bg-emerald-500'}`}
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Country performance */}
        <Card title="Country Performance" subtitle="Top 8 markets">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Country</th><th>Visits</th><th>Signups</th><th>Active now</th></tr>
              </thead>
              <tbody>
                {countryData.sort((a, b) => b.visits - a.visits).map((c) => (
                  <tr key={c.country}>
                    <td className="font-medium text-slate-200">{c.flag} {c.country}</td>
                    <td>{c.visits}</td>
                    <td>{c.signups}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs ${c.active > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {c.active > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {c.active}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Feature adoption */}
        <Card title="Feature Adoption">
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{f.name}</span>
                  <span className="text-slate-300 font-medium">{f.usage}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gulf-blue rounded-full"
                    style={{ width: `${f.usage}%`, background: `linear-gradient(90deg, #002776 0%, #B9D9EB ${f.usage}%)` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="text-xs text-slate-700 text-center">
        Analytics data is aggregated and anonymized. GDPR-compliant — no personal identifiers stored.
      </p>
    </div>
  );
}
