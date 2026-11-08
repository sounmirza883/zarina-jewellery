'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Zap,
  MessageCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { Product } from '@/types/product';
import { formatPKR } from '@/lib/shop-logic';
import { useCartStore } from '@/store/cart';
import { siteConfig } from '@/config/site';
import ProductImage from './ProductImage';
import ProductCard from './ProductCard';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Default');
  const [selectedSize, setSelectedSize] = useState(
    product.sizes ? product.sizes[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedColor, selectedSize);
  };

  const handleBuyNow = () => {
    addItem(product, quantity, selectedColor, selectedSize);
    router.push('/checkout');
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const whatsappInquiryUrl = `https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Assalam o Alaikum Zarina Jewels, I am interested in ordering: "${product.name}"\nPrice: ${formatPKR(
      product.price
    )}\nSelected Color: ${selectedColor}${selectedSize ? `\nSize: ${selectedSize}` : ''}`
  )}`;

  return (
    <div className="py-8 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#575757] mb-8">
          <Link href="/" className="hover:text-[#B8893B] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
          <Link href="/shop" className="hover:text-[#B8893B] transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
          <Link
            href={`/category/${product.category}`}
            className="capitalize hover:text-[#B8893B] transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
          <span className="text-[#1F1F1F] font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Main Image */}
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#F5EDE1] border border-[#B8893B]/20 shadow-md">
              <ProductImage
                src={product.images[activeImageIndex] || product.images[0]}
                alt={`${product.name} view ${activeImageIndex + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
              />

              {/* Badges on main image */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.isNew && (
                  <span className="bg-[#0B0D12] text-white text-xs tracking-wider uppercase font-medium px-2.5 py-1 rounded">
                    New Arrival
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="bg-[#B8893B] text-white text-xs tracking-wider uppercase font-medium px-2.5 py-1 rounded">
                    Best Seller
                  </span>
                )}
                {discountPercent && discountPercent > 0 && (
                  <span className="bg-[#991B1B] text-white text-xs tracking-wider uppercase font-medium px-2.5 py-1 rounded">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails Row */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#B8893B] ring-2 ring-[#B8893B]/20 shadow-xs'
                        : 'border-[#E8DDD0] hover:border-[#B8893B]/60 opacity-75 hover:opacity-100'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <ProductImage src={img} alt={`${product.name} thumbnail ${idx + 1}`} fill sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Buy Controls */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#B8893B] font-semibold">
                  {product.category}
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="text-xs text-[#575757] hover:text-[#B8893B] flex items-center gap-1 transition-colors"
                  title="Share link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#0B0D12] font-normal leading-tight">
                {product.name}
              </h1>

              {/* Pricing */}
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-[#0B0D12]">
                  {formatPKR(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-base text-[#8A8A8A] line-through">
                    {formatPKR(product.compareAtPrice)}
                  </span>
                )}
                {discountPercent && (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-[#575757]">
                Taxes included. Cash on Delivery payable at delivery.
              </p>
            </div>

            {/* Short Description */}
            <p className="text-sm text-[#575757] leading-relaxed border-t border-b border-[#E8DDD0] py-4">
              {product.description}
            </p>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider block">
                  Color / Finish:{' '}
                  <span className="text-[#B8893B] font-normal">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-1.5 rounded text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        selectedColor === color
                          ? 'border-[#0B0D12] bg-[#0B0D12] text-white shadow-xs'
                          : 'border-[#E8DDD0] bg-white text-[#1F1F1F] hover:border-[#B8893B]'
                      }`}
                    >
                      {selectedColor === color && <Check className="w-3.5 h-3.5" />}
                      <span>{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ring Size Selector (if applicable) */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Size: <span className="text-[#B8893B] font-normal">{selectedSize}</span>
                  </label>
                  <span className="text-[11px] text-[#575757] italic">Standard US / PK Ring Sizing</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 py-1.5 rounded text-xs font-medium border transition-all ${
                        selectedSize === size
                          ? 'border-[#0B0D12] bg-[#0B0D12] text-white'
                          : 'border-[#E8DDD0] bg-white text-[#1F1F1F] hover:border-[#B8893B]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector and Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-[#E8DDD0] rounded-md bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-[#575757] hover:text-[#1F1F1F] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-semibold text-[#1F1F1F] min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1.5 text-[#575757] hover:text-[#1F1F1F] transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart & Buy Now Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-4 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs font-semibold uppercase tracking-widest rounded-md transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-4 bg-[#B8893B] hover:bg-[#D9B66A] text-[#0B0D12] text-xs font-semibold uppercase tracking-widest rounded-md transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Buy Now (COD)</span>
                </button>
              </div>

              {/* WhatsApp Quick Order Inquiry */}
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 border border-emerald-600/40 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Order via WhatsApp Inquiry</span>
              </a>
            </div>

            {/* Trust Badges in Detail Column */}
            <div className="pt-4 border-t border-[#E8DDD0] space-y-2 text-xs text-[#575757]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B8893B] shrink-0" />
                <span><strong>Cash on Delivery</strong> available across all Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#B8893B] shrink-0" />
                <span>Standard delivery in <strong>2-4 business days</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#B8893B] shrink-0" />
                <span><strong>7-Day replacement</strong> if damaged or not as described</span>
              </div>
            </div>

            {/* Product Specifications & Details List */}
            <div className="pt-4 border-t border-[#E8DDD0]">
              <h3 className="font-serif text-lg font-medium text-[#1F1F1F] mb-3">
                Product Details & Care
              </h3>
              <ul className="space-y-2 text-xs text-[#575757]">
                {product.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8893B] mt-1.5 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#B8893B]/20">
            <div className="text-center mb-10">
              <span className="text-xs uppercase tracking-[0.2em] text-[#B8893B] font-semibold block mb-1">
                Complete Your Look
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#0B0D12] font-normal">
                You May Also Admire
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
