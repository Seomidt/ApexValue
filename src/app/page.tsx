import Link from 'next/link';
import { Zap, TrendingUp, Shield, Globe, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen cockpit-bg">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-gulf-blue/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gulf-orange rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">ApexValue</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm font-medium text-slate-300 hover:text-white">
              Log in
            </Link>
            <Link href="/login?demo=1" className="btn-primary text-sm px-4 py-2 rounded-lg">
              Try Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-gulf-orange/10 border border-gulf-orange/20 rounded-full px-4 py-1.5 text-sm text-gulf-orange font-medium mb-8">
          <Zap className="w-4 h-4" />
          Gulf Racing Cockpit for Car Dealers
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
          Find, Analyze & Profit<br />
          <span className="text-gulf-orange">from European Car Imports</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          ApexValue is the dealer cockpit for European car buyers, importers and exporters.
          Calculate real profit, model VAT schemes, estimate Danish registration tax, and track your pipeline — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login?demo=1"
            className="inline-flex items-center gap-2 bg-gulf-orange text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gulf-orange-alt transition-all shadow-orange-glow">
            Start Free Demo
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all">
            Log in
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-600">No credit card required · Demo mode with sample data</p>
      </section>

      {/* Racing stripe */}
      <div className="racing-stripe max-w-6xl mx-auto" />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything a car import dealer needs
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: TrendingUp, title: 'Profit Engine', desc: 'Model 3 scenarios (conservative/normal/optimistic). Compute max bid, break-even, and ROI instantly.' },
            { icon: Calculator, title: 'VAT Center', desc: 'Handle margin scheme, EU reverse charge, standard and private purchase VAT with capital binding indicator.' },
            { icon: Shield, title: 'DK Tax Ready', desc: 'Estimate Danish registration tax. Connect ASG Digital for official calculations in Pro mode.' },
            { icon: Globe, title: '8 Markets', desc: 'DE, DK, NL, SE, NO, PL, BE, FR. Multi-currency and multilingual (EN + DA, more coming).' },
            { icon: FileText, title: 'PDF Reports', desc: 'Generate dealer-grade investment reports with BUY/CONSIDER/DROP recommendations.' },
            { icon: GitBranch, title: 'Pipeline Tracker', desc: 'From Found → Sold. Track vehicles, documents, photos, and a Bilinfo-ready checklist.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 hover:border-gulf-powder/20 transition-all">
              <div className="w-10 h-10 bg-gulf-orange/10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-gulf-orange" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Simple, transparent pricing</h2>
        <p className="text-slate-400 text-center mb-12">Start free, upgrade when you need live data</p>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: 'Free', price: '€0', period: 'forever', desc: 'Demo mode — explore all features with sample data', features: ['All modules in demo mode', 'PDF report generation', 'DK tax estimator', 'VAT calculator', 'Pipeline tracker'], cta: 'Start Free', highlight: false },
            { name: 'Pro', price: '€299', period: '/month', desc: 'Live mode with your own API keys', features: ['Everything in Free', 'BYOK API integrations', 'Live auction data (Auto1)', 'Live market comps (mobile.de)', 'ASG tax API', 'Unlimited vehicles', 'Priority support'], cta: 'Get Pro', highlight: true },
            { name: 'Team', price: '€799', period: '/month', desc: 'For dealer teams — coming soon', features: ['Everything in Pro', 'Up to 10 users', 'Team collaboration', 'Shared pipeline', 'Role management', 'Audit log'], cta: 'Coming Soon', highlight: false },
          ].map(({ name, price, period, desc, features, cta, highlight }) => (
            <div key={name} className={`card p-6 ${highlight ? 'border-gulf-orange/50 shadow-orange-glow' : ''}`}>
              {highlight && <div className="badge-hot mb-3 inline-flex">Most Popular</div>}
              <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl font-extrabold text-white">{price}</span>
                <span className="text-slate-500 mb-1">{period}</span>
              </div>
              <p className="text-sm text-slate-400 mb-5">{desc}</p>
              <ul className="space-y-2 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login?demo=1"
                className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  highlight
                    ? 'bg-gulf-orange text-white hover:bg-gulf-orange-alt'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                }`}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center">
        <p className="text-slate-600 text-sm">
          © 2025 ApexValue · <a href="https://apexvalue.net" className="hover:text-slate-400">apexvalue.net</a>
        </p>
      </footer>
    </div>
  );
}

// Fix import
function Calculator(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />
    </svg>
  );
}

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function GitBranch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="6" x2="6" y1="3" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}
