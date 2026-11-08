import { createClient } from '@/lib/supabase/client';
import { rowToEvent, type OrderEventRow } from '@/lib/supabase/mappers';
import type { OrderEvent, OrderStatus } from '@/types/product';

// Runs in the browser as the signed-in admin; Row Level Security decides what is allowed.
// The database logs a timeline entry whenever the status, courier or tracking number changes.

export async function updateOrderDispatch(
  orderNumber: string,
  patch: { status?: OrderStatus; courier?: string | null; trackingNumber?: string | null }
): Promise<void> {
  const update: Record<string, string | null> = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.courier !== undefined) update.courier = patch.courier?.trim() || null;
  if (patch.trackingNumber !== undefined) update.tracking_number = patch.trackingNumber?.trim() || null;
  if (Object.keys(update).length === 0) return;

  const { data, error } = await createClient()
    .from('orders')
    .update(update)
    .eq('order_number', orderNumber)
    .select('order_number');
  if (error) throw new Error(error.message);
  // RLS hides rows from a non-admin without an error, so an empty result means nothing was saved.
  if (!data?.length) {
    throw new Error('Nothing was changed. You may have been signed out; sign in again as an admin.');
  }
}

export async function fetchOrderEvents(orderNumber: string): Promise<OrderEvent[]> {
  const { data, error } = await createClient()
    .from('order_events')
    .select('status, note, created_at')
    .eq('order_number', orderNumber)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as OrderEventRow[]).map(rowToEvent);
}
