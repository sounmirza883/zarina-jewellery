import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addRemote, removeRemote } from '@/lib/wishlist-api';
import { normalizeIds, toggleId } from '@/lib/wishlist';
import { useCartStore } from '@/store/cart';

interface WishlistState {
  /** Saved product ids, oldest first. */
  ids: string[];
  /** The signed-in customer this list belongs to (set by WishlistSync), or null for a guest list. */
  owner: string | null;

  /** Saves or removes a product. Signed-in customers also write to their account and undo on failure. */
  toggle: (productId: string) => void;
  /** Replaces the list with the account's list after sign-in. */
  adopt: (owner: string, ids: string[]) => void;
  /** Forgets an account-owned list (sign-out). A guest list is left alone. */
  releaseOwner: () => void;
}

const say = (message: string) => useCartStore.setState({ toastMessage: message });

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      owner: null,

      toggle: (productId) => {
        const { ids, owner } = get();
        const next = toggleId(ids, productId);
        if (next === ids) return; // invalid id or a full list
        const saved = next.includes(productId);

        set({ ids: next });
        say(saved ? 'Saved to your wishlist' : 'Removed from your wishlist');
        if (!owner) return;

        const write = saved ? addRemote(owner, productId) : removeRemote(owner, productId);
        void write.then((ok) => {
          if (ok) return;
          // The account copy could not be updated: put the heart back the way it was.
          set((state) => ({
            ids: state.owner === owner ? toggleId(state.ids, productId) : state.ids,
          }));
          say('Could not update your wishlist. Please try again.');
        });
      },

      adopt: (owner, ids) => set({ owner, ids: normalizeIds(ids) }),

      releaseOwner: () => {
        if (get().owner) set({ owner: null, ids: [] });
      },
    }),
    {
      name: 'zarina_jewels_wishlist_v1',
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // SSR safe fallback dummy storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({ ids: state.ids, owner: state.owner }),
      // Never trust what is in storage: keep only valid ids.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<WishlistState, 'ids' | 'owner'>>;
        return {
          ...current,
          ids: normalizeIds(p.ids),
          owner: typeof p.owner === 'string' ? p.owner : null,
        };
      },
    }
  )
);
