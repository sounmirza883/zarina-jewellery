'use client';

import { Heart } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useWishlistStore } from '@/store/wishlist';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  /** card = round heart over a product image, detail = text button on the product page */
  variant?: 'card' | 'detail';
}

export default function WishlistButton({ productId, productName, variant = 'card' }: WishlistButtonProps) {
  const saved = useWishlistStore((s) => s.ids.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  const handleClick = (e: React.MouseEvent) => {
    // The card's image is a link: saving must not open the product page.
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
  };

  // The heart pops when it changes (not on first render, so a page of saved hearts does not all bounce).
  const icon = (
    <AnimatePresence initial={false} mode="popLayout">
      <m.span
        key={saved ? 'saved' : 'unsaved'}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="inline-flex"
      >
        <Heart
          className={`${variant === 'card' ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${
            saved ? 'fill-[#B8893B] text-[#B8893B]' : ''
          }`}
          aria-hidden="true"
        />
      </m.span>
    </AnimatePresence>
  );

  if (variant === 'detail') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
        className={`text-xs flex items-center gap-1 transition-colors ${
          saved ? 'text-[#B8893B] font-medium' : 'text-[#575757] hover:text-[#B8893B]'
        }`}
      >
        {icon}
        <span>{saved ? 'Saved' : 'Save'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-[#1F1F1F] active:scale-95 motion-reduce:active:scale-100 transition-[background-color,transform] focus-visible:outline-2 focus-visible:outline-[#B8893B]"
    >
      {icon}
    </button>
  );
}
