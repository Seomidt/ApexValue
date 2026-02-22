import { redirect } from 'next/navigation';
import { getSessionWithUser } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { DemoBanner } from '@/components/layout/DemoBanner';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionWithUser();
  if (!ctx) redirect('/login');

  const { user, org } = ctx;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userRole={user.role ?? 'user'}
        orgName={org.name}
        userName={user.name}
        isDemo={org.isDemo ?? false}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-60">
        {/* Demo banner */}
        {org.isDemo && <DemoBanner />}

        {/* Topbar */}
        <header className="h-14 border-b border-white/10 bg-slate-950/50 backdrop-blur-sm flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {org.plan !== 'free' && (
              <span className="badge-info text-xs">
                {org.plan === 'pro' ? 'Pro' : 'Team'}
              </span>
            )}
            <div className="w-7 h-7 rounded-full bg-gulf-blue flex items-center justify-center text-xs font-bold text-gulf-powder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
