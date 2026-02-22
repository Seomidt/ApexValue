'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { Mail, Lock, User, Building } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = React.useState({ name: '', email: '', password: '', orgName: '' });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-slate-500 mt-0.5">Get started with ApexValue for free</p>
        </div>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" type="text" value={form.name} onChange={set('name')} placeholder="Jan Müller" required icon={<User className="w-4 h-4" />} />
          <Input label="Company / Org name" type="text" value={form.orgName} onChange={set('orgName')} placeholder="Müller Auto GmbH" required icon={<Building className="w-4 h-4" />} />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="jan@muller-auto.de" required icon={<Mail className="w-4 h-4" />} />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="min. 8 characters" required icon={<Lock className="w-4 h-4" />} />

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>}

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="text-gulf-powder hover:text-white">Log in</Link>
        </p>
      </div>
    </div>
  );
}
