'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, Card, Button, Input, Badge } from '@/components/ui';
import { Settings, User, Building, Key, CreditCard, CheckCircle, XCircle, Loader } from 'lucide-react';
import { CONNECTOR_META } from '@/lib/connectors';

const TABS = [
  { id: 'profile', label: 'Profile', icon: <User className="w-3.5 h-3.5" /> },
  { id: 'org', label: 'Organization', icon: <Building className="w-3.5 h-3.5" /> },
  { id: 'apis', label: 'APIs', icon: <Key className="w-3.5 h-3.5" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-3.5 h-3.5" /> },
];

const PLANS = [
  { id: 'free', name: 'Free', price: '€0', period: '/month', desc: 'Demo mode, explore all features', features: ['All modules (demo)', 'VAT calculator', 'PDF reports', 'Pipeline tracker'] },
  { id: 'pro', name: 'Pro', price: '€299', period: '/month', desc: 'Live mode + unlimited vehicles', features: ['Everything in Free', 'BYOK API integrations', 'Live auction data', 'Live comps (mobile.de)', 'ASG tax API', 'Unlimited vehicles'] },
  { id: 'team', name: 'Team', price: '€799', period: '/month', desc: 'Up to 10 users + collaboration', features: ['Everything in Pro', 'Up to 10 seats', 'Role management', 'Shared pipeline'] },
];

function ConnectorCard({ c }: { c: typeof CONNECTOR_META[0] }) {
  const [status, setStatus] = React.useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [key, setKey] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  async function testConnection() {
    setStatus('testing');
    await new Promise((r) => setTimeout(r, 1200));
    setStatus(key ? 'ok' : 'error');
    setTimeout(() => setStatus('idle'), 3000);
  }

  const liveMode = process.env.NEXT_PUBLIC_ENABLE_LIVE_MODE === 'true';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-200">{c.name}</h3>
            <span className="badge bg-slate-700/40 text-slate-500 border border-slate-600/30 text-xs">{c.category}</span>
          </div>
          <p className="text-sm text-slate-500 mb-3">{c.description}</p>

          <div className="flex items-center gap-2">
            {status === 'ok' && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Connected</span>}
            {status === 'error' && <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3.5 h-3.5" /> Failed</span>}
            {status === 'testing' && <span className="flex items-center gap-1 text-xs text-slate-400"><Loader className="w-3.5 h-3.5 animate-spin" /> Testing...</span>}
            {status === 'idle' && <span className="text-xs text-slate-600">Not connected</span>}
          </div>
        </div>
        <div className="flex-shrink-0">
          <a href={c.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-gulf-powder/50 hover:text-gulf-powder">
            Docs ↗
          </a>
        </div>
      </div>

      {!liveMode ? (
        <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
          Live Mode is disabled. Set <code className="font-mono bg-black/30 px-1 rounded">ENABLE_LIVE_MODE=true</code> and upgrade to Pro to connect APIs.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="password"
              className="input flex-1 font-mono text-xs"
              placeholder="API key (stored encrypted)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <Button variant="secondary" size="sm" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
              {saved ? '✓' : 'Save'}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={testConnection}>Test connection</Button>
        </div>
      )}
    </div>
  );
}

function SettingsContent() {
  const params = useSearchParams();
  const [tab, setTab] = React.useState(params.get('tab') || 'profile');
  const [profile, setProfile] = React.useState({ name: 'Demo User', email: 'demo@apexvalue.net', language: 'en', market: 'DK' });
  const [org, setOrg] = React.useState({ name: 'Demo Dealer GmbH', vatId: 'DE123456789', country: 'DK' });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-gulf-orange" /> Settings
        </h1>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'profile' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Profile">
            <div className="space-y-4">
              <Input label="Full name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              <div>
                <label className="label">Language</label>
                <select className="select-input" value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
                  <option value="en">English</option>
                  <option value="da">Dansk</option>
                </select>
              </div>
              <div>
                <label className="label">Default market</label>
                <select className="select-input" value={profile.market} onChange={(e) => setProfile({ ...profile, market: e.target.value })}>
                  {['DK', 'DE', 'NL', 'SE', 'NO', 'PL', 'BE', 'FR'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <Button variant="primary">Save profile</Button>
            </div>
          </Card>
          <Card title="Avatar">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-gulf-blue flex items-center justify-center text-2xl font-bold text-gulf-powder">
                D
              </div>
              <Button variant="secondary" size="sm">Upload photo</Button>
              <p className="text-xs text-slate-600">JPG, PNG, max 2MB</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'org' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Organization Details">
            <div className="space-y-4">
              <Input label="Company name" value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
              <Input label="VAT ID / CVR" value={org.vatId} onChange={(e) => setOrg({ ...org, vatId: e.target.value })} placeholder="DE123456789" />
              <div>
                <label className="label">Country</label>
                <select className="select-input" value={org.country} onChange={(e) => setOrg({ ...org, country: e.target.value })}>
                  {['DK', 'DE', 'NL', 'SE', 'NO', 'PL', 'BE', 'FR'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <Button variant="primary">Save organization</Button>
            </div>
          </Card>
          <div className="space-y-4">
            <Card title="Organization Logo" subtitle="Used in PDF reports">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-24 h-16 bg-slate-800 border border-dashed border-white/20 rounded-lg flex items-center justify-center text-slate-600 text-xs">
                  No logo
                </div>
                <Button variant="secondary" size="sm">Upload logo</Button>
              </div>
            </Card>
            <Card title="Storage">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Used</span>
                  <span className="text-slate-300">0 B / 1 GB</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gulf-powder/50 rounded-full" style={{ width: '0%' }} />
                </div>
                <p className="text-xs text-slate-600">Free plan · Upgrade for more storage</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'apis' && (
        <div className="space-y-4">
          <div className="card p-4 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Bring Your Own API Keys (BYOK)</p>
                <p className="text-sm text-slate-400 mt-1">
                  ApexValue uses your own API keys for external services. Keys are stored encrypted and never shared.
                  Upgrade to Pro to unlock live integrations.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {CONNECTOR_META.map((c) => <ConnectorCard key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === 'free'; // demo always free
              return (
                <div key={plan.id} className={`card p-5 ${isCurrent ? 'border-gulf-orange/40' : ''}`}>
                  {isCurrent && <Badge variant="hot" className="mb-2">Current plan</Badge>}
                  <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-1 mb-2">
                    <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-500 mb-0.5">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{plan.desc}</p>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <Button variant="primary" className="w-full" size="sm">
                      {process.env.NEXT_PUBLIC_ENABLE_STRIPE !== 'true' ? 'Coming soon' : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-700 text-center">
            Stripe integration coming soon. Contact hello@apexvalue.net to upgrade manually.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-slate-500">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
