'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';
import { addRemote, mergeRemote } from '@/lib/wishlist-api';
import { mergeIds } from '@/lib/wishlist';
import { useWishlistStore } from '@/store/wishlist';

/**
 * Keeps the browser wishlist and the customer's account in step. Renders nothing; mounted once in the layout.
 * - Signed in (once per page load): the browser list is merged into the account and the full account list is loaded.
 * - Signed out: a list that came from an account is cleared, so a shared computer does not keep it. A guest list stays.
 */
export default function WishlistSync() {
  useEffect(() => {
    if (!supabaseConfigured) return;

    let syncedFor: string | null = null;

    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      if (!session) {
        syncedFor = null;
        if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') useWishlistStore.getState().releaseOwner();
        return;
      }
      // Token refreshes and profile updates change nothing about the list.
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;

      const userId = session.user.id;
      if (syncedFor === userId) return;
      syncedFor = userId;

      // Not awaited inside the callback: Supabase calls made from here can wait on the auth lock forever.
      setTimeout(async () => {
        const state = useWishlistStore.getState();
        // A list that belonged to another account must not leak into this one.
        const local = state.owner && state.owner !== userId ? [] : state.ids;

        const merged = await mergeRemote(local);
        if (!merged) {
          syncedFor = null; // keep the browser list and try again on the next sign-in event
          return;
        }

        // Hearts tapped while the request was in flight are kept and saved too.
        const current = useWishlistStore.getState().ids;
        const finalIds = mergeIds(merged, current);
        useWishlistStore.getState().adopt(userId, finalIds);
        for (const id of finalIds) {
          if (!merged.includes(id)) void addRemote(userId, id);
        }
      }, 0);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
