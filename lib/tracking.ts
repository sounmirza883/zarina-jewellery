import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';
import type { Courier, TrackedOrder } from '@/types/product';

/** Public order lookup. Needs the order number AND the phone number used at checkout. */
export async function trackOrder(orderNumber: string, phone: string): Promise<TrackedOrder> {
  if (!supabaseConfigured) throw new Error('Order tracking is not available right now.');

  const { data, error } = await createClient().rpc('track_order', {
    p_order_number: orderNumber.trim(),
    p_phone: phone.trim(),
  });

  if (error || !data) {
    // P0001 carries the customer-safe message written inside track_order.
    throw new Error(
      error?.code === 'P0001' ? error.message : 'We could not look up your order right now. Please try again.'
    );
  }
  return data as TrackedOrder;
}

/** Fills {tracking} in a courier link template. Null when there is nothing safe to link to. */
export function buildTrackingUrl(template: string, trackingNumber: string): string | null {
  const number = trackingNumber.trim();
  if (!template.trim() || !number) return null;
  const url = template.trim().replace(/\{tracking\}/g, encodeURIComponent(number));
  return /^https?:\/\//i.test(url) ? url : null;
}

/** The courier's tracking link for an order, using the couriers saved in the admin Settings tab. */
export async function fetchCourierLink(courier: string, trackingNumber: string): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const { data } = await createClient().from('store_settings').select('data').maybeSingle();
  const couriers: Courier[] = data?.data?.couriers ?? [];
  const match = couriers.find((c) => c.name.trim().toLowerCase() === courier.trim().toLowerCase());
  return match ? buildTrackingUrl(match.trackingUrl, trackingNumber) : null;
}
