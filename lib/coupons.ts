import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';
import type { CartItem, CouponPreview } from '@/types/product';

export const COUPON_UNAVAILABLE = 'Coupons are not available right now. Please try again later.';

/**
 * Asks the database what the coupon would take off this bag. Throws an Error whose message can be shown
 * to the customer. This is only a preview: place_order works the discount out again when the order is placed.
 */
export async function validateCoupon(code: string, items: CartItem[]): Promise<CouponPreview> {
  if (!supabaseConfigured) throw new Error(COUPON_UNAVAILABLE);

  const { data, error } = await createClient().rpc('validate_coupon', {
    p_code: code.trim(),
    p_lines: items.map((i) => ({ variantId: i.variantId ?? i.cartItemId, quantity: i.quantity })),
  });

  // P0001 = a message written for customers inside the database functions; anything else is a server fault.
  if (error) throw new Error(error.code === 'P0001' ? error.message : COUPON_UNAVAILABLE);
  if (!data) throw new Error(COUPON_UNAVAILABLE);
  return data as CouponPreview;
}
