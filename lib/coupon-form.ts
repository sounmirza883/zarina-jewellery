import type { Coupon, CouponKind, ProductCategory } from '@/types/product';

// Mirrors the limits of the coupons table in supabase/schema.sql.
export const COUPON_CATEGORIES: ProductCategory[] = ['earrings', 'necklaces', 'rings', 'bracelets'];
export const CODE_PATTERN = /^[A-Z0-9_-]{3,20}$/;

/** The admin form keeps every field as text (or a flag) so inputs can be empty while typing. */
export interface CouponInput {
  code: string;
  kind: CouponKind;
  value: string;
  /** Empty = every category. */
  categories: ProductCategory[];
  minSubtotal: string;
  includeSaleItems: boolean;
  /** datetime-local values ("2026-11-10T09:00"), local time. */
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  oncePerCustomer: boolean;
  active: boolean;
}

export const EMPTY_COUPON: CouponInput = {
  code: '',
  kind: 'percent',
  value: '',
  categories: [],
  minSubtotal: '',
  includeSaleItems: true,
  startsAt: '',
  expiresAt: '',
  usageLimit: '',
  oncePerCustomer: false,
  active: true,
};

export type CouponErrors = Partial<Record<'code' | 'value' | 'minSubtotal' | 'usageLimit' | 'dates', string>>;

export const normalizeCode = (code: string) => code.trim().toUpperCase();

const isWholeNumber = (s: string) => /^\d{1,9}$/.test(s.trim());

/** One message per invalid field; an empty object means the coupon can be saved. */
export function validateCouponForm(input: CouponInput): CouponErrors {
  const errors: CouponErrors = {};

  if (!CODE_PATTERN.test(normalizeCode(input.code))) {
    errors.code = 'Use 3-20 letters, numbers, - or _ (for example SAVE10).';
  }

  if (input.kind === 'percent') {
    const v = Number(input.value);
    if (!isWholeNumber(input.value) || v < 1 || v > 100) errors.value = 'Enter a whole percentage from 1 to 100.';
  } else if (input.kind === 'fixed') {
    if (!isWholeNumber(input.value) || Number(input.value) < 1) errors.value = 'Enter the rupees to take off (at least 1).';
  }

  if (input.minSubtotal.trim() !== '' && !isWholeNumber(input.minSubtotal)) {
    errors.minSubtotal = 'Enter a whole amount in rupees, or leave it blank.';
  }
  if (input.usageLimit.trim() !== '' && (!isWholeNumber(input.usageLimit) || Number(input.usageLimit) < 1)) {
    errors.usageLimit = 'Enter a whole number of at least 1, or leave it blank for unlimited.';
  }

  const start = input.startsAt ? new Date(input.startsAt).getTime() : null;
  const end = input.expiresAt ? new Date(input.expiresAt).getTime() : null;
  if ((start !== null && Number.isNaN(start)) || (end !== null && Number.isNaN(end))) {
    errors.dates = 'Enter a valid date and time.';
  } else if (start !== null && end !== null && end <= start) {
    errors.dates = 'The expiry must be after the start.';
  }

  return errors;
}

/** The row for the coupons table. Call it only after validateCouponForm returned no errors. */
export function toCouponRow(input: CouponInput) {
  return {
    code: normalizeCode(input.code),
    kind: input.kind,
    value: input.kind === 'free_shipping' ? 0 : Number(input.value),
    categories: input.categories,
    min_subtotal: input.minSubtotal.trim() === '' ? 0 : Number(input.minSubtotal),
    include_sale_items: input.includeSaleItems,
    starts_at: input.startsAt ? new Date(input.startsAt).toISOString() : null,
    expires_at: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
    usage_limit: input.usageLimit.trim() === '' ? null : Number(input.usageLimit),
    once_per_customer: input.oncePerCustomer,
    active: input.active,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO timestamp -> the local "YYYY-MM-DDTHH:mm" a datetime-local input expects. */
export function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function couponToInput(c: Coupon): CouponInput {
  return {
    code: c.code,
    kind: c.kind,
    value: c.kind === 'free_shipping' ? '' : String(c.value),
    categories: c.categories,
    minSubtotal: c.minSubtotal ? String(c.minSubtotal) : '',
    includeSaleItems: c.includeSaleItems,
    startsAt: toLocalInput(c.startsAt),
    expiresAt: toLocalInput(c.expiresAt),
    usageLimit: c.usageLimit === undefined ? '' : String(c.usageLimit),
    oncePerCustomer: c.oncePerCustomer,
    active: c.active,
  };
}

function joinList(items: string[]): string {
  if (items.length <= 2) return items.join(' & ');
  return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;
}

/** "10% off rings & necklaces", "Rs. 500 off everything", "Free delivery". */
export function describeOffer(c: Pick<Coupon, 'kind' | 'value' | 'categories'>): string {
  const scope = c.categories.length > 0 ? joinList(c.categories) : '';
  if (c.kind === 'free_shipping') return scope ? `Free delivery with ${scope}` : 'Free delivery';
  const amount = c.kind === 'percent' ? `${c.value}% off` : `Rs. ${c.value.toLocaleString('en-PK')} off`;
  return `${amount} ${scope || 'everything'}`;
}

export type CouponStatus = 'disabled' | 'expired' | 'scheduled' | 'used-up' | 'active';

/** `used` = number of non-cancelled orders that used the coupon. */
export function couponStatus(c: Coupon, used: number, now: Date = new Date()): CouponStatus {
  if (!c.active) return 'disabled';
  if (c.expiresAt && now.getTime() >= new Date(c.expiresAt).getTime()) return 'expired';
  if (c.startsAt && now.getTime() < new Date(c.startsAt).getTime()) return 'scheduled';
  if (c.usageLimit !== undefined && used >= c.usageLimit) return 'used-up';
  return 'active';
}
