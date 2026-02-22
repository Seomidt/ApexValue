import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen cockpit-bg flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-gulf-orange rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">ApexValue</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Cockpit decorative lines */}
          <div className="flex gap-1 mb-6">
            <div className="h-1 flex-1 bg-gulf-orange rounded-full" />
            <div className="h-1 w-8 bg-gulf-powder/50 rounded-full" />
            <div className="h-1 w-4 bg-white/10 rounded-full" />
          </div>

          {children}
        </div>
      </div>

      <div className="p-6 text-center">
        <p className="text-xs text-slate-700">
          © 2025 ApexValue · <a href="https://apexvalue.net" className="hover:text-slate-500">apexvalue.net</a>
        </p>
      </div>
    </div>
  );
}
