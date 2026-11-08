import { createClient } from '@/lib/supabase/client';
import { rowToCoupon, type CouponRow } from '@/lib/supabase/mappers';
import { toCouponRow, type CouponInput } from '@/lib/coupon-form';
import type { Coupon } from '@/types/product';

// Runs in the browser as the signed-in admin; Row Level Security enforces "admin only".

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  // 23505 = unique violation: the code is the primary key.
  if (error.code === '23505') throw new Error('A coupon with this code already exists.');
  throw new Error(error.message);
}

// RLS hides rows from a non-admin without an error, so an empty result means nothing changed.
function requireRows(rows: unknown[] | null) {
  if (!rows?.length) {
    throw new Error('Nothing was changed. You may have been signed out; sign in again as an admin.');
  }
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await createClient()
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  check(error);
  return (data as CouponRow[]).map(rowToCoupon);
}

/**
 * Uses per code, counted from orders that were not cancelled (a cancelled order gives its use back).
 * shortcut: reads the newest 1000 coupon orders (the API row limit), upgrade to an SQL view if a store gets more.
 */
export async function fetchCouponUses(): Promise<Record<string, number>> {
  const { data, error } = await createClient()
    .from('orders')
    .select('coupon_code')
    .not('coupon_code', 'is', null)
    .neq('status', 'Cancelled')
    .order('created_at', { ascending: false })
    .limit(1000);
  check(error);
  const uses: Record<string, number> = {};
  for (const row of data as { coupon_code: string }[]) {
    uses[row.coupon_code] = (uses[row.coupon_code] ?? 0) + 1;
  }
  return uses;
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const { data, error } = await createClient().from('coupons').insert(toCouponRow(input)).select('*');
  check(error);
  requireRows(data);
  return rowToCoupon((data as CouponRow[])[0]);
}

export async function updateCoupon(code: string, input: CouponInput): Promise<Coupon> {
  const { data, error } = await createClient()
    .from('coupons')
    .update(toCouponRow(input))
    .eq('code', code)
    .select('*');
  check(error);
  requireRows(data);
  return rowToCoupon((data as CouponRow[])[0]);
}

export async function setCouponActive(code: string, active: boolean): Promise<void> {
  const { data, error } = await createClient().from('coupons').update({ active }).eq('code', code).select('code');
  check(error);
  requireRows(data);
}

/** Orders keep the code as plain text, so deleting a coupon never changes an order. */
export async function deleteCoupon(code: string): Promise<void> {
  const { data, error } = await createClient().from('coupons').delete().eq('code', code).select('code');
  check(error);
  requireRows(data);
}
