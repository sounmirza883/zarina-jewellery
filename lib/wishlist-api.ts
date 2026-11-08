import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';
import { isValidId, normalizeIds } from '@/lib/wishlist';

// Signed-in customers only. Runs in the browser as the customer; Row Level Security (supabase/schema.sql)
// limits every call to their own rows. Nothing here throws into the UI: a failure returns null/false and
// the caller keeps the browser copy.

/** Merges the browser list into the account and returns the full account list, or null on failure. */
export async function mergeRemote(ids: string[]): Promise<string[] | null> {
  if (!supabaseConfigured) return null;
  const { data, error } = await createClient().rpc('wishlist_merge', { p_ids: normalizeIds(ids) });
  if (error) return null;
  return normalizeIds(data);
}

/** Saves one product to the account. Returns false when it could not be saved. */
export async function addRemote(userId: string, productId: string): Promise<boolean> {
  if (!supabaseConfigured || !isValidId(productId)) return false;
  const { error } = await createClient()
    .from('wishlist_items')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
  return !error;
}

/** Removes one product from the account. Returns false when it could not be removed. */
export async function removeRemote(userId: string, productId: string): Promise<boolean> {
  if (!supabaseConfigured || !isValidId(productId)) return false;
  const { error } = await createClient()
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  return !error;
}
