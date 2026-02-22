'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui';
import {
  LayoutDashboard, Search, Car, Calculator, GitBranch,
  FileText, BarChart3, Settings, Shield, LogOut, Zap, Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/auction-finder', label: 'Auction Finder', icon: Search },
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/vat-center', label: 'VAT Center', icon: Calculator },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  userRole?: string;
  orgName?: string;
  userName?: string;
  isDemo?: boolean;
}

export function Sidebar({ userRole, orgName, userName, isDemo }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gulf-orange rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">ApexValue</span>
            {isDemo && (
              <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
                Demo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Racing stripe */}
      <div className="racing-stripe" />

      {/* Org context */}
      {orgName && (
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Organization</p>
          <p className="text-sm font-medium text-gulf-powder truncate mt-0.5">{orgName}</p>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn('nav-item', pathname.startsWith(href) && 'active')}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        {/* Admin link for superadmin */}
        {userRole === 'superadmin' && (
          <Link
            href="/admin"
            className={cn('nav-item mt-2', pathname.startsWith('/admin') && 'active')}
            onClick={() => setMobileOpen(false)}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            Admin
          </Link>
        )}
      </nav>

      {/* Bottom items */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn('nav-item', pathname.startsWith(href) && 'active')}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="nav-item w-full text-left text-red-400/70 hover:text-red-400">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Log out
          </button>
        </form>
      </div>

      {/* User info */}
      {userName && (
        <div className="px-4 py-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gulf-blue flex items-center justify-center text-xs font-bold text-gulf-powder">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">{userName}</p>
              <p className="text-xs text-slate-600 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gulf-blue rounded-lg text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        'lg:hidden fixed left-0 top-0 h-full w-60 bg-gulf-blue z-40 transform transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-60 bg-gulf-blue fixed left-0 top-0 h-full z-30 border-r border-white/10">
        <SidebarContent />
      </div>
    </>
  );
}
