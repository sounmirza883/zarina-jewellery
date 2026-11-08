import { createClient } from '@/lib/supabase/client';
import { rowToReview, type ReviewRow } from '@/lib/supabase/mappers';
import { revalidateStorefront } from '@/app/actions/revalidate';
import type { Review } from '@/types/product';

// Runs in the browser as the signed-in admin; Row Level Security enforces "admin only".

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// RLS hides rows from a non-admin without an error, so an empty result means nothing changed.
function requireRows(rows: unknown[] | null) {
  if (!rows?.length) {
    throw new Error('Nothing was changed. You may have been signed out; sign in again as an admin.');
  }
}

// Best effort: the database write already succeeded and pages also refresh on a timer.
async function refreshStorefront() {
  try {
    await revalidateStorefront();
  } catch (e) {
    console.warn('Storefront refresh failed', e);
  }
}

export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await createClient()
    .from('reviews')
    // Named columns on purpose: user_id is not readable through the API, even for the admin.
    .select('id, product_id, rating, author_name, title, body, status, is_verified, created_at, products(name)')
    .order('created_at', { ascending: false })
    .limit(500);
  check(error);
  return (data as unknown as ReviewRow[]).map(rowToReview);
}

export async function approveReview(id: string): Promise<void> {
  const { data, error } = await createClient()
    .from('reviews')
    .update({ status: 'approved' })
    .eq('id', id)
    .select('id');
  check(error);
  requireRows(data);
  await refreshStorefront();
}

export async function deleteReview(id: string): Promise<void> {
  const { data, error } = await createClient().from('reviews').delete().eq('id', id).select('id');
  check(error);
  requireRows(data);
  await refreshStorefront();
}
