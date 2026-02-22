import { getSessionWithUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { vehicles, profitScenarios, vehicleHistory } from '@/lib/schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { KPICard, Badge, DealScoreRing } from '@/components/ui';
import Link from 'next/link';
import { TrendingUp, AlertTriangle, Flame, Activity, ArrowRight } from 'lucide-react';
import { fmt } from '@/lib/calculations';

async function getDashboardData(orgId: string) {
  const [allVehicles, scenarios, history] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.orgId, orgId)).orderBy(desc(vehicles.createdAt)).limit(50),
    db.select().from(profitScenarios).where(eq(profitScenarios.orgId, orgId)),
    db.select().from(vehicleHistory).where(eq(vehicleHistory.orgId, orgId)).orderBy(desc(vehicleHistory.createdAt)).limit(15),
  ]);

  const active = allVehicles.filter((v) => v.status !== 'sold');
  const scenarioMap = new Map(scenarios.map((s) => [s.vehicleId, s]));

  const totalProfit = active.reduce((s, v) => {
    const sc = scenarioMap.get(v.id);
    return s + (sc?.normalProfitEur ?? 0);
  }, 0);

  const avgROI = active.length > 0
    ? active.reduce((s, v) => {
        const sc = scenarioMap.get(v.id);
        return s + (sc?.normalRoi ?? 0);
      }, 0) / active.length
    : 0;

  const hotDeals = allVehicles.filter((v) => (v.dealScore ?? 0) >= 65 && v.status !== 'sold');
  const riskVehicles = allVehicles.filter((v) => (v.dealScore ?? 0) < 40 && v.status !== 'sold');

  return { allVehicles, active, totalProfit, avgROI, hotDeals, riskVehicles, history, scenarioMap };
}

export default async function DashboardPage() {
  const ctx = await getSessionWithUser();
  if (!ctx) return null;
  const { org } = ctx;

  const { active, totalProfit, avgROI, hotDeals, riskVehicles, history, scenarioMap, allVehicles } = await getDashboardData(org.id);

  const statusColors: Record<string, string> = {
    found: 'text-slate-400', evaluating: 'text-blue-400', bid_placed: 'text-purple-400',
    won: 'text-emerald-400', transport: 'text-cyan-400', prep: 'text-amber-400',
    ready: 'text-lime-400', listed: 'text-gulf-orange', sold: 'text-emerald-300',
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cockpit</h1>
          <p className="text-sm text-slate-500 mt-0.5">{org.name} · Live overview</p>
        </div>
        <Link href="/auction-finder" className="btn-primary text-sm flex items-center gap-2">
          <Flame className="w-4 h-4" />
          Find Deals
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Pipeline"
          value={active.length}
          sub={`${allVehicles.filter(v => v.status === 'sold').length} sold total`}
          icon={<Activity className="w-4 h-4" />}
          color="powder"
        />
        <KPICard
          label="Potential Profit"
          value={fmt(totalProfit, 'EUR')}
          sub="Normal scenario, active vehicles"
          icon={<TrendingUp className="w-4 h-4" />}
          color="green"
        />
        <KPICard
          label="Avg ROI"
          value={`${(avgROI * 100).toFixed(1)}%`}
          sub="Normal scenario average"
          color={avgROI > 0.12 ? 'green' : avgROI > 0.05 ? 'default' : 'red'}
        />
        <KPICard
          label="Hot Deals"
          value={hotDeals.length}
          sub={`${riskVehicles.length} risk alerts`}
          icon={<Flame className="w-4 h-4" />}
          color="orange"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hot Deals */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-gulf-orange" />
              <h2 className="font-semibold text-slate-200">Hot Deals</h2>
              <Badge variant="hot">{hotDeals.length}</Badge>
            </div>
            <Link href="/auction-finder" className="text-xs text-gulf-powder/60 hover:text-gulf-powder flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {hotDeals.slice(0, 6).map((v) => {
              const sc = scenarioMap.get(v.id);
              return (
                <Link key={v.id} href={`/vehicles/${v.id}`}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors">
                  <DealScoreRing score={v.dealScore ?? 0} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 text-sm truncate">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-slate-500">{v.sourceName} · {v.sourceCountry} · {(v.mileageKm ?? 0).toLocaleString()} km</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-emerald-400">{fmt(sc?.normalProfitEur ?? 0)}</p>
                    <p className="text-xs text-slate-500">{((sc?.normalRoi ?? 0) * 100).toFixed(1)}% ROI</p>
                  </div>
                  <span className={`text-xs font-medium ${statusColors[v.status ?? ''] ?? 'text-slate-500'} capitalize`}>
                    {v.status}
                  </span>
                </Link>
              );
            })}
            {hotDeals.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-500 text-sm">
                No hot deals yet. Import vehicles to get started.
              </div>
            )}
          </div>
        </div>

        {/* Risk Alerts + Activity */}
        <div className="space-y-6">
          {/* Risk alerts */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="font-semibold text-slate-200 text-sm">Risk Alerts</h2>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {riskVehicles.slice(0, 5).map((v) => (
                <Link key={v.id} href={`/vehicles/${v.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-400">{v.dealScore}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{v.make} {v.model} {v.year}</p>
                    <p className="text-xs text-slate-600">Score &lt; 40 · {v.status}</p>
                  </div>
                </Link>
              ))}
              {riskVehicles.length === 0 && (
                <p className="px-4 py-4 text-xs text-slate-600 text-center">No risk alerts</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gulf-powder/50" />
                <h2 className="font-semibold text-slate-200 text-sm">Recent Activity</h2>
              </div>
            </div>
            <div className="px-4 py-2 space-y-2">
              {history.slice(0, 8).map((h) => (
                <div key={h.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gulf-powder/30 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 truncate">{h.content}</p>
                    <p className="text-xs text-slate-700">{new Date(h.createdAt ?? '').toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-xs text-slate-600 py-2 text-center">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline status overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-200">Pipeline Status</h2>
          <Link href="/pipeline" className="text-xs text-gulf-powder/60 hover:text-gulf-powder flex items-center gap-1">
            Manage pipeline <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-4 sm:grid-cols-9 gap-2">
            {(['found', 'evaluating', 'bid_placed', 'won', 'transport', 'prep', 'ready', 'listed', 'sold'] as const).map((status) => {
              const count = allVehicles.filter((v) => v.status === status).length;
              const labels: Record<string, string> = {
                found: 'Found', evaluating: 'Eval', bid_placed: 'Bid', won: 'Won',
                transport: 'Transit', prep: 'Prep', ready: 'Ready', listed: 'Listed', sold: 'Sold',
              };
              return (
                <div key={status} className="text-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <p className={`text-xl font-bold ${statusColors[status]}`}>{count}</p>
                  <p className="text-xs text-slate-600 mt-1">{labels[status]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
