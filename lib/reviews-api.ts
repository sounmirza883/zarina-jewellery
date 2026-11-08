import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { supabaseConfigured } from '@/lib/supabase/config';
import { rowToReview, type ReviewRow } from '@/lib/supabase/mappers';
import type { Review } from '@/types/product';

/** Newest approved reviews for a product page (server side, max 50). */
export const getApprovedReviews = cache(async (productId: string): Promise<Review[]> => {
  if (!supabaseConfigured) return [];

  const { data, error } = await createPublicClient()
    .from('reviews')
    // Named columns on purpose: user_id is not readable by visitors.
    .select('id, product_id, rating, author_name, title, body, status, is_verified, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    // Reviews are optional content, so a failure must not take the product page down.
    console.error(`Could not load reviews: ${error.message}`);
    return [];
  }
  return (data as ReviewRow[]).map(rowToReview);
});
