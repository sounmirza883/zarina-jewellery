'use client';

import Link from 'next/link';
import { ShoppingBag, Eye } from 'lucide-react';
import { Product } from '@/types/product';
import { formatPKR } from '@/lib/shop-logic';
import { activeVariants, discountPercent as calcDiscount, isPurchasable, priceRange } from '@/lib/pricing';
import { useCartStore } from '@/store/cart';
import ProductImage from './ProductImage';
import StarRating from './StarRating';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const range = priceRange(product);
  const discountPercent = calcDiscount(product.regularPrice, product.price);
  const soldOut = !isPurchasable(product);
  // Quick add only makes sense when there is exactly one thing to add; otherwise the shopper picks options on the product page.
  const inStockVariants = activeVariants(product).filter((v) => v.stockQty > 0);
  const quickAddVariant = inStockVariants.length === 1 ? inStockVariants[0] : undefined;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quickAddVariant) addItem(product, quickAddVariant, 1);
  };

  return (
    <div className="group flex flex-col bg-white rounded-lg border border-[#FAF7F2] hover:border-[#B8893B]/30 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Product Image Container */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-[#F5EDE1]"
        aria-label={`View ${product.name}`}
      >
        <div
          className={`w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out ${
            soldOut ? 'opacity-60' : ''
          }`}
        >
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        {/* Badges Container */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {soldOut && (
            <span className="inline-block bg-[#575757] text-white text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-sm shadow-xs">
              Sold out
            </span>
          )}
          {product.isNew && (
            <span className="inline-block bg-[#0B0D12] text-[#FAF7F2] text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-sm shadow-xs">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="inline-block bg-[#B8893B] text-white text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-sm shadow-xs">
              Best Seller
            </span>
          )}
          {discountPercent > 0 && (
            <span className="inline-block bg-[#991B1B] text-white text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-sm shadow-xs">
              Save {discountPercent}%
            </span>
          )}
        </div>

        {/* Quick Add Overlay on hover (Desktop) & persistent bottom bar (Touch/Mobile) */}
        {!soldOut && (
          <div className="absolute inset-x-2 bottom-2 z-10 flex gap-1.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            {quickAddVariant ? (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs font-medium rounded shadow transition-colors duration-200"
                aria-label={`Quick add ${product.name} to cart`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Quick Add</span>
              </button>
            ) : (
              // Not a nested link: the whole image area already links to the product page.
              <span className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0B0D12] text-white text-xs font-medium rounded shadow">
                <span>Select options</span>
              </span>
            )}
            <span
              className="hidden sm:flex items-center justify-center p-2 bg-white/90 hover:bg-white text-[#1F1F1F] rounded shadow transition-colors"
              title="Quick view"
            >
              <Eye className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </Link>

      {/* Product Information */}
      <div className="p-3.5 flex flex-col flex-1">
        <span className="text-[11px] uppercase tracking-wider text-[#575757] font-medium capitalize mb-1">
          {product.category}
        </span>

        <h3 className="font-serif text-base text-[#1F1F1F] font-medium line-clamp-1 group-hover:text-[#B8893B] transition-colors mb-1.5">
          <Link href={`/product/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        {product.ratingCount > 0 && (
          <StarRating value={product.ratingAvg} size="sm" count={product.ratingCount} className="mb-1.5" />
        )}

        <div className="mt-auto pt-1 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#1F1F1F]">
            {range.hasRange && <span className="text-xs font-normal text-[#575757]">From </span>}
            {formatPKR(range.min)}
          </span>
          {!range.hasRange && discountPercent > 0 && (
            <span className="text-xs text-[#8A8A8A] line-through">{formatPKR(product.regularPrice)}</span>
          )}
        </div>

        {/* Available colors indicator */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-2 text-[11px] text-[#575757] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8893B]"></span>
            <span className="truncate">{product.colors.length} {product.colors.length === 1 ? 'color' : 'colors'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
