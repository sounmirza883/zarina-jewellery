'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import {
  createCoupon,
  deleteCoupon,
  fetchCouponUses,
  fetchCoupons,
  setCouponActive,
  updateCoupon,
} from '@/lib/admin-coupons';
import {
  COUPON_CATEGORIES,
  EMPTY_COUPON,
  couponStatus,
  couponToInput,
  describeOffer,
  validateCouponForm,
  type CouponErrors,
  type CouponInput,
  type CouponStatus,
} from '@/lib/coupon-form';
import { formatPKR } from '@/lib/shop-logic';
import type { Coupon, CouponKind, ProductCategory } from '@/types/product';

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

const KINDS: { value: CouponKind; label: string }[] = [
  { value: 'percent', label: 'Percentage off' },
  { value: 'fixed', label: 'Fixed amount off (Rs.)' },
  { value: 'free_shipping', label: 'Free delivery' },
];

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  earrings: 'Earrings',
  necklaces: 'Necklaces',
  rings: 'Rings',
  bracelets: 'Bracelets',
};

const STATUS_STYLE: Record<CouponStatus, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  expired: { label: 'Expired', cls: 'bg-stone-100 text-stone-700 border-stone-200' },
  'used-up': { label: 'Used up', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  disabled: { label: 'Disabled', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
};

const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1';
const inputCls =
  'w-full px-3 py-2 text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B] disabled:opacity-60';
const border = (error?: string) => (error ? 'border-rose-500' : 'border-[#E8DDD0]');
const formatWhen = (iso: string) => new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-[#575757]">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

// editing: null = form closed, '' = a new coupon, otherwise the code being edited
export default function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [uses, setUses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CouponInput>(EMPTY_COUPON);
  const [errors, setErrors] = useState<CouponErrors>({});
  const [saving, setSaving] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCoupons(), fetchCouponUses()])
      .then(([list, counts]) => {
        setCoupons(list);
        setUses(counts);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setForm(EMPTY_COUPON);
    setErrors({});
    setEditing('');
  };

  const openEdit = (coupon: Coupon) => {
    setForm(couponToInput(coupon));
    setErrors({});
    setEditing(coupon.code);
  };

  const closeForm = () => {
    setEditing(null);
    setErrors({});
  };

  const set = <K extends keyof CouponInput>(key: K, value: CouponInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleCategory = (category: ProductCategory) =>
    set(
      'categories',
      form.categories.includes(category)
        ? form.categories.filter((c) => c !== category)
        : [...form.categories, category]
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCouponForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (editing === '') {
        const created = await createCoupon(form);
        setCoupons((list) => [created, ...list]);
      } else {
        const updated = await updateCoupon(editing as string, form);
        setCoupons((list) => list.map((c) => (c.code === updated.code ? updated : c)));
      }
      setError('');
      closeForm();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    setBusyCode(coupon.code);
    try {
      await setCouponActive(coupon.code, !coupon.active);
      setCoupons((list) => list.map((c) => (c.code === coupon.code ? { ...c, active: !c.active } : c)));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyCode(null);
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon ${coupon.code}? Past orders keep their discount. This cannot be undone.`)) return;
    setBusyCode(coupon.code);
    try {
      await deleteCoupon(coupon.code);
      setCoupons((list) => list.filter((c) => c.code !== coupon.code));
      if (editing === coupon.code) closeForm();
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyCode(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="shrink-0 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#575757]">
          Customers enter a coupon code at checkout. Delivery stays free above the free-shipping amount, even with a coupon.
        </p>
        {editing === null && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create coupon
          </button>
        )}
      </div>

      {editing !== null && (
        <form
          onSubmit={save}
          noValidate
          className="bg-white rounded-xl border border-[#B8893B]/30 shadow-xs p-5 sm:p-6 space-y-5"
          aria-label={editing === '' ? 'Create coupon' : `Edit coupon ${editing}`}
        >
          <h3 className="font-serif text-lg text-[#0B0D12]">
            {editing === '' ? 'New coupon' : `Edit ${editing}`}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              id="coupon-code"
              label="Coupon code"
              error={errors.code}
              hint="Customers type this in at checkout. It cannot be changed later."
            >
              <input
                id="coupon-code"
                type="text"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                disabled={editing !== ''}
                maxLength={20}
                autoComplete="off"
                placeholder="SAVE10"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? 'coupon-code-error' : undefined}
                className={`${inputCls} ${border(errors.code)} font-mono`}
              />
            </Field>

            <Field id="coupon-kind" label="Type">
              <select
                id="coupon-kind"
                value={form.kind}
                onChange={(e) => set('kind', e.target.value as CouponKind)}
                className={`${inputCls} ${border()}`}
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>

            {form.kind !== 'free_shipping' && (
              <Field
                id="coupon-value"
                label={form.kind === 'percent' ? 'Percent off (1-100)' : 'Rupees off'}
                error={errors.value}
              >
                <input
                  id="coupon-value"
                  type="text"
                  inputMode="numeric"
                  value={form.value}
                  onChange={(e) => set('value', e.target.value)}
                  placeholder={form.kind === 'percent' ? '10' : '500'}
                  aria-invalid={!!errors.value}
                  aria-describedby={errors.value ? 'coupon-value-error' : undefined}
                  className={`${inputCls} ${border(errors.value)}`}
                />
              </Field>
            )}

            <Field
              id="coupon-min"
              label="Minimum spend (Rs.)"
              error={errors.minSubtotal}
              hint="Measured on the items the coupon applies to. Blank = no minimum."
            >
              <input
                id="coupon-min"
                type="text"
                inputMode="numeric"
                value={form.minSubtotal}
                onChange={(e) => set('minSubtotal', e.target.value)}
                placeholder="3000"
                aria-invalid={!!errors.minSubtotal}
                aria-describedby={errors.minSubtotal ? 'coupon-min-error' : undefined}
                className={`${inputCls} ${border(errors.minSubtotal)}`}
              />
            </Field>
          </div>

          <fieldset>
            <legend className={labelCls}>Works on</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#1F1F1F]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.categories.length === 0}
                  onChange={() => set('categories', [])}
                  className="w-4 h-4 accent-[#B8893B]"
                />
                All categories
              </label>
              {COUPON_CATEGORIES.map((category) => (
                <label key={category} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 accent-[#B8893B]"
                  />
                  {CATEGORY_LABEL[category]}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-[#575757]">
              Tick the categories this coupon is for. The discount applies only to items in those categories.
            </p>
          </fieldset>

          <label className="inline-flex items-start gap-2 text-sm text-[#1F1F1F] cursor-pointer">
            <input
              type="checkbox"
              checked={form.includeSaleItems}
              onChange={(e) => set('includeSaleItems', e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#B8893B]"
            />
            <span>
              Also applies to items already on sale
              <span className="block text-[11px] text-[#575757]">
                Untick it to leave items that show a sale price out of the discount.
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="coupon-start" label="Starts (optional)" error={errors.dates}>
              <input
                id="coupon-start"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
                className={`${inputCls} ${border(errors.dates)}`}
              />
            </Field>
            <Field id="coupon-end" label="Expires (optional)">
              <input
                id="coupon-end"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
                className={`${inputCls} ${border(errors.dates)}`}
              />
            </Field>
            <Field
              id="coupon-limit"
              label="Total uses (optional)"
              error={errors.usageLimit}
              hint="For example 100 = the first 100 orders. A cancelled order gives its use back."
            >
              <input
                id="coupon-limit"
                type="text"
                inputMode="numeric"
                value={form.usageLimit}
                onChange={(e) => set('usageLimit', e.target.value)}
                placeholder="Unlimited"
                aria-invalid={!!errors.usageLimit}
                aria-describedby={errors.usageLimit ? 'coupon-limit-error' : undefined}
                className={`${inputCls} ${border(errors.usageLimit)}`}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#1F1F1F]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.oncePerCustomer}
                onChange={(e) => set('oncePerCustomer', e.target.checked)}
                className="w-4 h-4 accent-[#B8893B]"
              />
              Once per customer (by phone number or account)
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
                className="w-4 h-4 accent-[#B8893B]"
              />
              Active
            </label>
          </div>

          <div className="pt-4 border-t border-[#E8DDD0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="px-5 py-2.5 rounded-lg border border-[#E8DDD0] text-xs font-semibold uppercase tracking-wider text-[#575757] hover:border-[#B8893B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#0B0D12] hover:bg-[#B8893B] disabled:opacity-60 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md"
            >
              {saving ? 'Saving...' : editing === '' ? 'Create coupon' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[#575757]">Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8DDD0] p-10 text-center text-sm text-[#575757]">
          No coupons yet. Create the first one to give customers a discount code.
        </div>
      ) : (
        <ul className="space-y-3">
          {coupons.map((coupon) => {
            const used = uses[coupon.code] ?? 0;
            const status = STATUS_STYLE[couponStatus(coupon, used)];
            const busy = busyCode === coupon.code;
            return (
              <li key={coupon.code} className="bg-white rounded-xl border border-[#B8893B]/20 shadow-xs p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-base font-bold text-[#0B0D12]">{coupon.code}</p>
                    <p className="mt-0.5 text-sm text-[#1F1F1F]">{describeOffer(coupon)}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${status.cls}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="mt-3 text-[11px] text-[#575757] leading-relaxed">
                  Used {used}
                  {coupon.usageLimit !== undefined ? ` of ${coupon.usageLimit}` : ''}
                  {coupon.minSubtotal > 0 && ` · Minimum spend ${formatPKR(coupon.minSubtotal)}`}
                  {coupon.oncePerCustomer && ' · Once per customer'}
                  {!coupon.includeSaleItems && ' · Not on sale items'}
                  {coupon.startsAt && ` · Starts ${formatWhen(coupon.startsAt)}`}
                  {coupon.expiresAt && ` · Expires ${formatWhen(coupon.expiresAt)}`}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(coupon)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E8DDD0] hover:border-[#B8893B] disabled:opacity-60 text-xs font-semibold text-[#1F1F1F] cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(coupon)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E8DDD0] hover:border-[#B8893B] disabled:opacity-60 text-xs font-semibold text-[#1F1F1F] cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" aria-hidden="true" />
                    {coupon.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(coupon)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-60 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
