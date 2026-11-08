'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import AuthShell, { FormError, inputClass, labelClass, primaryButtonClass } from '@/components/AuthShell';
import { NOT_CONFIGURED, getCurrentUser, updatePassword } from '@/lib/account';
import { supabaseConfigured } from '@/lib/supabase/config';

export default function ResetPasswordPage() {
  const router = useRouter();
  // The reset email link signs the customer in (via /auth/callback); without that session there is nothing to reset.
  const [session, setSession] = useState<'checking' | 'ok' | 'none'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setSession(user ? 'ok' : 'none'))
      .catch(() => setSession('none'));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Your password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');

    setBusy(true);
    const message = await updatePassword(password);
    setBusy(false);
    if (message) return setError(message);

    setDone(true);
    setTimeout(() => router.replace('/account'), 1500);
  };

  return (
    <AuthShell eyebrow="Account Help" title="Choose a New Password">
      {!supabaseConfigured ? (
        <FormError message={NOT_CONFIGURED} />
      ) : session === 'checking' ? (
        <p className="text-center text-xs text-[#575757]">Checking your link…</p>
      ) : session === 'none' ? (
        <div className="space-y-3 text-center">
          <FormError message="This reset link is invalid or has expired." />
          <Link href="/forgot-password" className="inline-block text-xs font-semibold text-[#B8893B] hover:underline">
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div role="status" className="text-center space-y-3 py-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
          <h2 className="font-serif text-xl text-[#1F1F1F]">Password updated</h2>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {error && <FormError message={error} />}
          <div>
            <label htmlFor="reset-password" className={labelClass}>
              New Password
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className={inputClass}
            />
            <span className="text-[10px] text-[#8A8A8A] block mt-1">At least 8 characters.</span>
          </div>
          <div>
            <label htmlFor="reset-confirm" className={labelClass}>
              Confirm New Password
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError('');
              }}
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
