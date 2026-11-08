'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import AuthShell, { FormError, inputClass, labelClass, primaryButtonClass } from '@/components/AuthShell';
import { NOT_CONFIGURED, signUp } from '@/lib/account';
import { supabaseConfigured } from '@/lib/supabase/config';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return setError('Please enter your full name.');
    if (password.length < 8) return setError('Your password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');

    setBusy(true);
    const result = await signUp(fullName.trim(), email.trim(), password);
    setBusy(false);
    if (result.error) return setError(result.error);

    if (result.needsConfirmation) {
      setConfirmEmail(true);
    } else {
      router.replace('/account');
      router.refresh();
    }
  };

  const clearError = () => setError('');

  return (
    <AuthShell
      eyebrow="Join Us"
      title="Create Your Account"
      subtitle="Track your orders and save your delivery details."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#B8893B] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {!supabaseConfigured ? (
        <FormError message={NOT_CONFIGURED} />
      ) : confirmEmail ? (
        <div role="status" className="text-center space-y-3 py-2">
          <MailCheck className="w-10 h-10 text-emerald-700 mx-auto" />
          <h2 className="font-serif text-xl text-[#1F1F1F]">Check your email to confirm</h2>
          <p className="text-xs text-[#575757] leading-relaxed">
            We sent a confirmation link to <strong>{email.trim()}</strong>. Open it to activate your account, then log in.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {error && <FormError message={error} />}

          <div>
            <label htmlFor="signup-name" className={labelClass}>
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError();
              }}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="signup-email" className={labelClass}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="signup-password" className={labelClass}>
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              className={inputClass}
            />
            <span className="text-[10px] text-[#8A8A8A] block mt-1">At least 8 characters.</span>
          </div>

          <div>
            <label htmlFor="signup-confirm" className={labelClass}>
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                clearError();
              }}
              className={inputClass}
            />
          </div>

          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
