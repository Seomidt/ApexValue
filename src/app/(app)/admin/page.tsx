import { redirect } from 'next/navigation';
import { getSessionWithUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations, users, analyticsEvents } from '@/lib/schema';
import { desc, count } from 'drizzle-orm';
import { Shield, Building, Users, Activity, AlertTriangle } from 'lucide-react';
import { Badge, Card, KPICard } from '@/components/ui';

export default async function AdminPage() {
  const ctx = await getSessionWithUser();
  if (!ctx || ctx.user.role !== 'superadmin') redirect('/dashboard');

  const [orgs, allUsers, recentEvents] = await Promise.all([
    db.select().from(organizations).orderBy(desc(organizations.createdAt)),
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt)).limit(30),
  ]);

  const planColors: Record<string, string> = {
    free: 'badge bg-slate-700/40 text-slate-400 border border-slate-600/30',
    pro: 'badge-buy',
    team: 'badge bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-gulf-orange" /> Super Admin
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Full system access · handle with care</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Organizations" value={orgs.length} icon={<Building className="w-4 h-4" />} color="powder" />
        <KPICard label="Total users" value={allUsers.length} icon={<Users className="w-4 h-4" />} color="default" />
        <KPICard label="Active orgs" value={orgs.filter(o => o.isActive).length} color="green" />
        <KPICard label="Pro/Team orgs" value={orgs.filter(o => o.plan !== 'free').length} color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orgs table */}
        <Card title="Organizations">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Org</th><th>Plan</th><th>Users</th><th>Demo</th><th>Active</th></tr>
              </thead>
              <tbody>
                {orgs.map((org) => {
                  const orgUsers = allUsers.filter(u => u.orgId === org.id);
                  return (
                    <tr key={org.id}>
                      <td>
                        <p className="font-medium text-slate-200 text-sm">{org.name}</p>
                        <p className="text-xs text-slate-600">{org.slug}</p>
                      </td>
                      <td><span className={planColors[org.plan ?? 'free']}>{org.plan}</span></td>
                      <td>{orgUsers.length}</td>
                      <td>{org.isDemo ? <Badge variant="demo">Demo</Badge> : '–'}</td>
                      <td>
                        <span className={`w-2 h-2 rounded-full inline-block ${org.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent events */}
        <Card title="Recent Events" subtitle="Last 30 system events">
          <div className="space-y-1.5">
            {recentEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-slate-600" />
                  <span className="text-xs text-slate-400 font-mono">{e.event}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>{e.country || '–'}</span>
                  <span>{new Date(e.createdAt ?? '').toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <p className="text-center text-slate-600 text-xs py-4">No events yet</p>
            )}
          </div>
        </Card>

        {/* Users table */}
        <Card title="All Users" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Org</th><th>Active</th><th>Created</th></tr>
              </thead>
              <tbody>
                {allUsers.map((u) => {
                  const org = orgs.find(o => o.id === u.orgId);
                  return (
                    <tr key={u.id}>
                      <td className="font-medium text-slate-200">{u.name}</td>
                      <td className="text-slate-400 font-mono text-xs">{u.email}</td>
                      <td>
                        <span className={`badge text-xs ${u.role === 'superadmin' ? 'badge-hot' : u.role === 'orgadmin' ? 'badge-buy' : 'bg-slate-700/40 text-slate-400 border border-slate-600/30'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-slate-500 text-xs">{org?.name || '–'}</td>
                      <td>
                        <span className={`w-2 h-2 rounded-full inline-block ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      </td>
                      <td className="text-slate-600 text-xs">{new Date(u.createdAt ?? '').toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="card p-4 border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-300 font-medium">Super Admin access</p>
        </div>
        <p className="text-xs text-slate-500 mt-1">All actions are audit-logged. Changes to organizations and users affect live production data.</p>
      </div>
    </div>
  );
}
