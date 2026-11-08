'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import AuthShell, { FormError, inputClass, labelClass, primaryButtonClass } from '@/components/AuthShell';
import { NOT_CONFIGURED, requestPasswordReset } from '@/lib/account';
import { supabaseConfigured } from '@/lib/supabase/config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const message = await requestPasswordReset(email.trim());
    setBusy(false);
    if (message) return setError(message);
    setSent(true);
  };

  return (
    <AuthShell
      eyebrow="Account Help"
      title="Forgot Password"
      subtitle="We will email you a link to choose a new one."
      footer={
        <Link href="/login" className="font-semibold text-[#B8893B] hover:underline">
          Back to log in
        </Link>
      }
    >
      {!supabaseConfigured ? (
        <FormError message={NOT_CONFIGURED} />
      ) : sent ? (
        <div role="status" className="text-center space-y-3 py-2">
          <MailCheck className="w-10 h-10 text-emerald-700 mx-auto" />
          <h2 className="font-serif text-xl text-[#1F1F1F]">Check your email</h2>
          <p className="text-xs text-[#575757] leading-relaxed">
            If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {error && <FormError message={error} />}
          <div>
            <label htmlFor="forgot-email" className={labelClass}>
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
