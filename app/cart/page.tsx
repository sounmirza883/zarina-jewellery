'use client';

import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPKR } from '@/lib/shop-logic';
import ProductImage from '@/components/ProductImage';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotals } = useCartStore();
  const totals = getTotals();

  const freeThreshold = useCartStore((s) => s.shipping.freeShippingThreshold);
  const progressPercent = Math.min(100, Math.round((totals.subtotal / freeThreshold) * 100));

  return (
    <div className="py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#575757] mb-8">
          <Link href="/" className="hover:text-[#B8893B]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
          <span className="text-[#1F1F1F] font-medium">Shopping Bag</span>
        </nav>

        <div className="mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
            Your Shopping Bag
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#575757]">
            {items.length === 0
              ? 'Your bag is currently empty.'
              : `You have ${totals.totalItemCount} item${totals.totalItemCount === 1 ? '' : 's'} in your bag.`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#B8893B]/20 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#B8893B] mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 opacity-60" />
            </div>
            <h2 className="font-serif text-2xl text-[#1F1F1F] font-normal mb-2">
              Your bag is empty
            </h2>
            <p className="text-sm text-[#575757] mb-8 leading-relaxed">
              Explore our handcrafted collections of earrings, necklaces, rings, and bracelets. Cash on Delivery is available across Pakistan.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs uppercase tracking-widest font-semibold rounded transition-colors shadow-md"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Items Column */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free shipping banner */}
              <div className="p-4 bg-[#F5EDE1] rounded-xl border border-[#B8893B]/30 text-xs">
                {totals.isFreeShipping ? (
                  <p className="text-emerald-800 font-semibold flex items-center gap-1.5">
                    <span>🎉</span> You qualify for FREE Nationwide Delivery across Pakistan!
                  </p>
                ) : (
                  <p className="text-[#1F1F1F]">
                    Add <strong className="text-[#B8893B]">{formatPKR(totals.freeShippingRemaining)}</strong> more to your bag for <strong>FREE Nationwide Delivery</strong> (Orders over Rs. 3,500).
                  </p>
                )}
                <div className="w-full bg-[#E8DDD0] h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-[#B8893B] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items Table/Cards */}
              <div className="bg-white rounded-xl border border-[#E8DDD0] divide-y divide-[#FAF7F2] shadow-xs overflow-hidden">
                {items.map((item) => (
                  <div key={item.cartItemId} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-lg overflow-hidden shrink-0 bg-[#F5EDE1]">
                      <ProductImage
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="112px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#575757] font-semibold">
                            {item.product.category}
                          </span>
                          <h3 className="font-serif text-base sm:text-lg text-[#1F1F1F] font-medium">
                            <Link href={`/product/${item.product.slug}`} className="hover:text-[#B8893B] transition-colors">
                              {item.product.name}
                            </Link>
                          </h3>
                        </div>
                        <span className="text-sm sm:text-base font-semibold text-[#1F1F1F] sm:text-right">
                          {formatPKR(item.product.price * item.quantity)}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-[#575757] flex flex-wrap gap-x-4 gap-y-1">
                        <span>Color: <strong className="text-[#1F1F1F]">{item.selectedColor}</strong></span>
                        {item.selectedSize && (
                          <span>Size: <strong className="text-[#1F1F1F]">{item.selectedSize}</strong></span>
                        )}
                        <span>Unit: {formatPKR(item.product.price)}</span>
                      </div>

                      {/* Stepper & Remove */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center border border-[#E8DDD0] rounded bg-[#FAF7F2]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="px-2.5 py-1 text-[#575757] hover:text-[#1F1F1F]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-semibold text-[#1F1F1F] min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="px-2.5 py-1 text-[#575757] hover:text-[#1F1F1F]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.cartItemId)}
                          className="text-xs text-[#8A8A8A] hover:text-[#991B1B] flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <Link
                  href="/shop"
                  className="text-xs text-[#575757] hover:text-[#B8893B] font-medium underline underline-offset-4"
                >
                  ← Continue Shopping
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-[#8A8A8A] hover:text-[#991B1B]"
                >
                  Clear Bag
                </button>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-xl border border-[#B8893B]/20 shadow-sm space-y-5 sticky top-24">
                <h2 className="font-serif text-xl font-medium text-[#1F1F1F] pb-3 border-b border-[#FAF7F2]">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-[#575757]">
                    <span>Bag Subtotal</span>
                    <span className="font-semibold text-[#1F1F1F]">{formatPKR(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#575757]">
                    <span>Nationwide Delivery</span>
                    <span className="font-semibold text-[#1F1F1F]">
                      {totals.isFreeShipping ? (
                        <span className="text-emerald-700">FREE</span>
                      ) : (
                        formatPKR(totals.shipping)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#1F1F1F] pt-3 border-t border-[#FAF7F2]">
                    <span>Total Amount</span>
                    <span className="text-xl text-[#B8893B]">{formatPKR(totals.total)}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD0] space-y-1 text-xs text-[#575757]">
                  <div className="flex items-center gap-1.5 font-semibold text-[#1F1F1F]">
                    <ShieldCheck className="w-4 h-4 text-[#B8893B]" />
                    <span>Cash on Delivery Only</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Pay in cash directly to the courier representative when your parcel is delivered to your home or office.
                  </p>
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-3.5 px-4 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs uppercase tracking-widest font-semibold rounded-md transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
