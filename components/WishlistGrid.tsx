'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { Product } from '@/types/product';
import { useWishlistStore } from '@/store/wishlist';
import { useSignedIn } from '@/lib/account';
import { supabaseConfigured } from '@/lib/supabase/config';
import ProductCard from './ProductCard';

const subscribe = () => () => {};

/** The saved list lives in the browser, so it is only known after hydration; until then show a quiet placeholder. */
export default function WishlistGrid({ products }: { products: Product[] }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const ids = useWishlistStore((s) => s.ids);
  const signedIn = useSignedIn();

  const saved = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    // Pieces that were removed from the catalogue are skipped quietly.
    return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  }, [products, ids]);

  return (
    <div className="py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block mb-2">
            Saved for Later
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#0B0D12] font-normal tracking-tight">My Wishlist</h1>
          <p className="mt-3 text-sm sm:text-base text-[#575757] leading-relaxed">
            {mounted && saved.length > 0
              ? `${saved.length} ${saved.length === 1 ? 'piece' : 'pieces'} you love. Tap the heart to remove one.`
              : 'The pieces you love, all in one place.'}
          </p>
          <div className="w-16 h-0.5 bg-[#B8893B] mx-auto mt-4" />
        </div>

        {!mounted ? (
          <div className="py-16 text-center text-xs tracking-wider uppercase text-[#575757]">Loading your wishlist...</div>
        ) : saved.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-[#FAF7F2] p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#B8893B] mx-auto mb-4">
              <Heart className="w-8 h-8 opacity-70" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-xl font-medium text-[#1F1F1F] mb-2">Your wishlist is empty</h2>
            <p className="text-xs text-[#575757] mb-6 leading-relaxed">
              Tap the heart on any piece to save it here and come back to it later.
            </p>
            <Link
              href="/shop"
              className="inline-flex px-6 py-2.5 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs uppercase tracking-wider font-medium rounded transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {saved.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 4} />
            ))}
          </div>
        )}

        {mounted && supabaseConfigured && !signedIn && (
          <p className="mt-10 text-center text-xs text-[#575757]">
            Your wishlist is saved in this browser.{' '}
            <Link href="/login?next=/wishlist" className="text-[#B8893B] font-semibold hover:underline">
              Log in
            </Link>{' '}
            or{' '}
            <Link href="/signup" className="text-[#B8893B] font-semibold hover:underline">
              create an account
            </Link>{' '}
            to keep it on all your devices.
          </p>
        )}
      </div>
    </div>
  );
}
