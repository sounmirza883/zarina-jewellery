'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, LogOut } from 'lucide-react';
import AuthShell, { FormError, inputClass, labelClass, primaryButtonClass } from '@/components/AuthShell';
import AccountNav from '@/components/AccountNav';
import { siteConfig } from '@/config/site';
import { NOT_CONFIGURED, fetchMyProfile, getCurrentUser, saveMyProfile, signOut } from '@/lib/account';
import { isValidPakistaniPhone } from '@/lib/shop-logic';
import { supabaseConfigured } from '@/lib/supabase/config';

const emptyForm = { fullName: '', phone: '', province: '', city: '', address: '' };

export default function AccountPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace('/login?next=/account');
          return;
        }
        const profile = await fetchMyProfile();
        if (cancelled) return;
        setEmail(user.email);
        if (profile) {
          setForm({
            fullName: profile.fullName,
            phone: profile.phone,
            province: profile.province,
            city: profile.city,
            address: profile.address,
          });
        }
        setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load your details.');
          setStatus('ready');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const update = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved(false);
    setError('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = form.phone.trim();
    if (form.fullName.trim().length < 2) return setError('Please enter your full name.');
    if (phone && !isValidPakistaniPhone(phone)) {
      return setError('Enter a valid Pakistani mobile number (e.g. 0300 1234567) or leave it blank.');
    }

    setSaving(true);
    try {
      await saveMyProfile({
        fullName: form.fullName.trim(),
        phone,
        province: form.province,
        city: form.city.trim(),
        address: form.address.trim(),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your details.');
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    router.replace('/');
    router.refresh();
  };

  return (
    <AuthShell eyebrow="My Account" title="My Details" subtitle={email || undefined} wide>
      {!supabaseConfigured ? (
        <FormError message={NOT_CONFIGURED} />
      ) : status === 'loading' ? (
        <p className="text-center text-xs text-[#575757]">Loading your details…</p>
      ) : (
        <>
          <AccountNav />
          <form onSubmit={onSubmit} className="space-y-5">
            {error && <FormError message={error} />}
            {saved && (
              <p role="status" className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Your details are saved. They will pre-fill at checkout.</span>
              </p>
            )}

            <div>
              <label htmlFor="acc-name" className={labelClass}>
                Full Name
              </label>
              <input id="acc-name" type="text" autoComplete="name" value={form.fullName} onChange={update('fullName')} className={inputClass} />
            </div>

            <div>
              <label htmlFor="acc-phone" className={labelClass}>
                Mobile Number
              </label>
              <input id="acc-phone" type="tel" autoComplete="tel" placeholder="0300 1234567" value={form.phone} onChange={update('phone')} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="acc-province" className={labelClass}>
                  Province / Region
                </label>
                <select id="acc-province" value={form.province} onChange={update('province')} className={inputClass}>
                  <option value="">Select…</option>
                  {siteConfig.provinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="acc-city" className={labelClass}>
                  City / Town
                </label>
                <input id="acc-city" type="text" autoComplete="address-level2" value={form.city} onChange={update('city')} className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="acc-address" className={labelClass}>
                Delivery Address
              </label>
              <textarea
                id="acc-address"
                rows={3}
                autoComplete="street-address"
                placeholder="House/Apartment #, Street #, Block/Sector, Area name, Landmark..."
                value={form.address}
                onChange={update('address')}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" disabled={saving} className={primaryButtonClass}>
                {saving ? 'Saving…' : 'Save Details'}
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-3.5 px-4 border border-[#E8DDD0] hover:border-[#B8893B] text-[#1F1F1F] text-xs uppercase tracking-widest font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
