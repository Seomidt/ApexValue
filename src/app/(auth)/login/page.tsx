'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { Mail, Lock } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = React.useState(params.get('demo') === '1' ? 'demo@apexvalue.net' : '');
  const [password, setPassword] = React.useState(params.get('demo') === '1' ? 'Demo1234!' : '');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [initializing, setInitializing] = React.useState(true);

  // Auto-init DB + seed on first page load
  React.useEffect(() => {
    fetch('/api/init').finally(() => setInitializing(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isDemoMode = params.get('demo') === '1';

  return (
    <div className="card">
      {initializing && (
        <div className="px-6 py-2 bg-gulf-blue/30 border-b border-white/10 text-xs text-gulf-powder/60 flex items-center gap-2">
          <span className="w-3 h-3 border border-gulf-powder/30 border-t-gulf-powder rounded-full animate-spin" />
          Initializing demo database...
        </div>
      )}
      <div className="card-header">
        <div>
          <h1 className="text-xl font-bold text-white">
            {isDemoMode ? '🏁 Try Demo Mode' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isDemoMode ? 'Pre-filled with demo credentials' : 'Sign in to your ApexValue account'}
          </p>
        </div>
      </div>
      <div className="card-body">
        {isDemoMode && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
            Demo account pre-filled. Click <strong>Log in</strong> to explore.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            icon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            icon={<Lock className="w-4 h-4" />}
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-center">
          <Link href="/reset-password" className="text-sm text-gulf-powder/60 hover:text-gulf-powder">
            Forgot password?
          </Link>
          <p className="text-sm text-slate-600">
            No account?{' '}
            <Link href="/signup" className="text-gulf-powder hover:text-white">
              Sign up
            </Link>
          </p>
          {!isDemoMode && (
            <p className="text-xs text-slate-700">
              Or{' '}
              <Link href="/login?demo=1" className="text-gulf-orange hover:text-gulf-orange-alt">
                try the demo
              </Link>
            </p>
          )}
        </div>

        {/* Dev hints */}
        <details className="mt-4">
          <summary className="text-xs text-slate-700 cursor-pointer hover:text-slate-500">Dev accounts</summary>
          <div className="mt-2 space-y-1 text-xs text-slate-600 font-mono">
            <p>demo@apexvalue.net / Demo1234!</p>
            <p>admin@apexvalue.net / Admin1234!</p>
          </div>
        </details>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card p-8 text-center text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
