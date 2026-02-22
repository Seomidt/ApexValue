'use client';

import React from 'react';
import Link from 'next/link';
import { Input, Button } from '@/components/ui';
import { Mail } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Stub: show confirmation
    setSent(true);
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h1 className="text-xl font-bold text-white">Reset password</h1>
          <p className="text-sm text-slate-500 mt-0.5">Enter your email to receive a reset link</p>
        </div>
      </div>
      <div className="card-body">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-300 font-medium">Check your email</p>
            <p className="text-sm text-slate-500 mt-1">If {email} has an account, you'll receive a reset link shortly.</p>
            <Link href="/login" className="btn-primary mt-4 inline-block">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" required icon={<Mail className="w-4 h-4" />} />
            <Button type="submit" variant="primary" className="w-full">Send reset link</Button>
            <p className="text-center text-sm text-slate-600">
              <Link href="/login" className="text-gulf-powder hover:text-white">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
