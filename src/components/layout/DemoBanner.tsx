'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, X } from 'lucide-react';

export function DemoBanner() {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-300">
          <span className="font-semibold">Demo Mode</span>
          <span className="text-amber-300/70"> – You're viewing sample data. </span>
          <Link href="/settings?tab=apis" className="underline text-amber-400 hover:text-amber-300">
            Connect APIs
          </Link>
          <span className="text-amber-300/70"> or </span>
          <Link href="/settings?tab=billing" className="underline text-amber-400 hover:text-amber-300">
            Upgrade to Pro
          </Link>
          <span className="text-amber-300/70"> to enable live mode.</span>
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-500/70 hover:text-amber-400 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
