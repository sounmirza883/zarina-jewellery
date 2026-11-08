'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell, { FormError, inputClass, labelClass, primaryButtonClass } from '@/components/AuthShell';
import { NOT_CONFIGURED, getCurrentUser, signIn } from '@/lib/account';
import { supabaseConfigured } from '@/lib/supabase/config';
import { safeNext } from '@/lib/safe-next';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const linkError = params.get('error') === 'callback' ? 'That link is invalid or has expired. Please try again.' : '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in: skip the form.
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) router.replace(next);
    });
  }, [router, next]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const message = await signIn(email.trim(), password);
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Log In"
      subtitle="See your orders and check out faster."
      footer={
        <>
          New to {`Zarina Jewels`}?{' '}
          <Link href="/signup" className="font-semibold text-[#B8893B] hover:underline">
            Create an account
          </Link>
          <p className="mt-2">You can also check out as a guest without an account.</p>
        </>
      }
    >
      {!supabaseConfigured ? (
        <FormError message={NOT_CONFIGURED} />
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {(error || linkError) && <FormError message={error || linkError} />}

          <div>
            <label htmlFor="login-email" className={labelClass}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="login-password" className={labelClass}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className={inputClass}
            />
            <Link href="/forgot-password" className="mt-2 inline-block text-[11px] text-[#575757] hover:text-[#B8893B]">
              Forgot your password?
            </Link>
          </div>

          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? 'Signing in…' : 'Log In'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs text-[#575757]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
