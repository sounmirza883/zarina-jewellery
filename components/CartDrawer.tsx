'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPKR } from '@/lib/shop-logic';
import ProductImage from './ProductImage';

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    getTotals,
  } = useCartStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  const totals = getTotals();
  const freeThreshold = useCartStore((s) => s.shipping.freeShippingThreshold);
  const progressPercent = Math.min(100, Math.round((totals.subtotal / freeThreshold) * 100));

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-[#FAF7F2] shadow-2xl flex flex-col border-l border-[#B8893B]/20 text-[#1F1F1F]"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Bag"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#FAF7F2] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#B8893B]" />
              <h2 className="font-serif text-lg sm:text-xl font-semibold tracking-wide text-[#1F1F1F]">
                Shopping Bag ({totals.totalItemCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-1.5 text-[#575757] hover:text-[#1F1F1F] rounded-full hover:bg-[#FAF7F2] transition-colors"
              aria-label="Close shopping bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-5 py-3 bg-[#F5EDE1] border-b border-[#B8893B]/15 text-xs">
            {totals.isFreeShipping ? (
              <p className="text-emerald-800 font-medium flex items-center gap-1.5">
                <span>🎉</span> You qualify for <strong>FREE Nationwide Delivery</strong>!
              </p>
            ) : (
              <p className="text-[#575757]">
                Add <strong className="text-[#1F1F1F]">{formatPKR(totals.freeShippingRemaining)}</strong> more for <strong>FREE Delivery</strong>
              </p>
            )}
            <div className="w-full bg-[#E8DDD0] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#B8893B] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#F5EDE1] flex items-center justify-center text-[#B8893B] mb-4">
                  <ShoppingBag className="w-8 h-8 opacity-70" />
                </div>
                <h3 className="font-serif text-lg font-medium text-[#1F1F1F] mb-1">
                  Your bag is empty
                </h3>
                <p className="text-sm text-[#575757] max-w-xs mb-6">
                  Explore our handcrafted jewellery collections and find your signature piece.
                </p>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="px-6 py-2.5 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs uppercase tracking-wider font-medium rounded transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-3.5 bg-white p-3 rounded-lg border border-[#F3ECE1] shadow-2xs relative"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 rounded overflow-hidden shrink-0 bg-[#F5EDE1]">
                    <ProductImage
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="80px"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.product.slug}`}
                          onClick={closeDrawer}
                          className="font-serif text-sm font-medium text-[#1F1F1F] hover:text-[#B8893B] transition-colors line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.cartItemId)}
                          className="text-[#8A8A8A] hover:text-[#991B1B] p-1 transition-colors"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Options */}
                      <div className="text-[11px] text-[#575757] space-y-0.5 mt-0.5">
                        <p>Color: <span className="text-[#1F1F1F] font-medium">{item.selectedColor}</span></p>
                        {item.selectedSize && (
                          <p>Size: <span className="text-[#1F1F1F] font-medium">{item.selectedSize}</span></p>
                        )}
                      </div>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#FAF7F2] mt-2">
                      <div className="flex items-center border border-[#E8DDD0] rounded bg-[#FAF7F2]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="p-1 px-2 text-[#575757] hover:text-[#1F1F1F] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold px-2 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="p-1 px-2 text-[#575757] hover:text-[#1F1F1F] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-[#1F1F1F]">
                          {formatPKR(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-[#F3ECE1] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#575757]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1F1F1F]">{formatPKR(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#575757]">
                  <span>Nationwide Shipping</span>
                  <span className="font-semibold text-[#1F1F1F]">
                    {totals.isFreeShipping ? 'FREE' : formatPKR(totals.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-[#1F1F1F] pt-2 border-t border-[#FAF7F2]">
                  <span>Estimated Total</span>
                  <span className="text-base text-[#B8893B]">{formatPKR(totals.total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#575757] bg-[#FAF7F2] p-2 rounded justify-center border border-[#E8DDD0]/50">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B8893B]" />
                <span>Cash on Delivery Only • Pay when your parcel arrives</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="w-full py-2.5 px-3 border border-[#0B0D12] text-[#0B0D12] hover:bg-[#FAF7F2] text-xs font-medium tracking-wider uppercase rounded text-center transition-colors flex items-center justify-center"
                >
                  View Bag
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="w-full py-2.5 px-3 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs font-medium tracking-wider uppercase rounded text-center transition-colors flex items-center justify-center gap-1 shadow"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
