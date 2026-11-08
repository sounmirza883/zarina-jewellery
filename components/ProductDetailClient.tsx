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
import { Product, Review } from '@/types/product';
import { formatPKR } from '@/lib/shop-logic';
import {
  activeVariants,
  defaultVariant,
  discountPercent as calcDiscount,
  findVariant,
  optionGroups,
  stockLabel,
  variantLabel,
  variantPrice,
} from '@/lib/pricing';
import { useCartStore } from '@/store/cart';
import { siteConfig } from '@/config/site';
import ProductImage from './ProductImage';
import ProductCard from './ProductCard';
import StarRating from './StarRating';
import ReviewsSection from './ReviewsSection';
import WishlistButton from './WishlistButton';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  reviews: Review[];
}

const MAX_QTY = 20;

export default function ProductDetailClient({
  product,
  relatedProducts,
  reviews,
}: ProductDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const active = activeVariants(product);
  const groups = optionGroups(product.variants);
  const initial = defaultVariant(product);

  const [selectedColor, setSelectedColor] = useState(initial?.color ?? '');
  const [selectedSize, setSelectedSize] = useState(initial?.size ?? '');
  const [pickedImage, setPickedImage] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  const variant = findVariant(product.variants, selectedColor, selectedSize);
  const stock = variant?.stockQty ?? 0;
  const canBuy = product.inStock && !!variant && stock > 0;
  const maxQty = Math.max(1, Math.min(stock, MAX_QTY));
  const qty = Math.min(Math.max(quantity, 1), maxQty);

  const price = variant ? variantPrice(variant) : product.price;
  const regularPrice = variant ? variant.regularPrice : product.regularPrice;
  const discountPercent = calcDiscount(regularPrice, price);

  // Choosing one option keeps the other when that combination exists; otherwise it moves to the nearest in-stock combination.
  const choose = (next: { color?: string; size?: string }) => {
    const color = next.color ?? selectedColor;
    const size = next.size ?? selectedSize;
    const sameOption = (v: { color: string; size: string }) =>
      next.color !== undefined ? v.color === color : v.size === size;
    const match =
      findVariant(product.variants, color, size) ??
      active.find((v) => sameOption(v) && v.stockQty > 0) ??
      active.find(sameOption);
    setSelectedColor(match?.color ?? color);
    setSelectedSize(match?.size ?? size);
    setPickedImage(null);
    setQuantity(1);
  };

  const colorAvailable = (c: string) => active.some((v) => v.color === c && v.stockQty > 0);
  const sizeAvailable = (s: string) => active.some((v) => v.size === s && v.stockQty > 0);

  // A thumbnail the shopper clicked wins; otherwise show the selected variant's own image, then the first gallery image.
  const mainImage =
    pickedImage !== null ? product.images[pickedImage] : (variant?.imageUrl ?? product.images[0]);
  const highlightedIndex = pickedImage ?? product.images.indexOf(mainImage);

  const handleAddToCart = () => {
    if (canBuy) addItem(product, variant, qty);
  };

  const handleBuyNow = () => {
    if (!canBuy) return;
    addItem(product, variant, qty);
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
    `Assalam o Alaikum Zarina Jewels, I am interested in ordering: "${product.name}"\nPrice: ${formatPKR(price)}${
      variant ? `\nOption: ${variantLabel(variant)}` : ''
    }`
  )}`;

  // The short description sits under the title; the long one gets its own section unless it is all there is.
  const topText = product.shortDescription || product.description;
  const paragraphs = product.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const showLongDescription = paragraphs.length > 0 && product.description.trim() !== topText.trim();
  const specRows = [
    ...(variant?.sku ? [{ name: 'SKU', value: variant.sku }] : []),
    ...product.attributes,
  ];

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
                src={mainImage}
                alt={`${product.name} view ${Math.max(highlightedIndex, 0) + 1}`}
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
                {discountPercent > 0 && (
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
                    onClick={() => setPickedImage(idx)}
                    className={`relative w-20 h-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      highlightedIndex === idx
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
                <div className="flex items-center gap-4">
                  <WishlistButton productId={product.id} productName={product.name} variant="detail" />
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
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#0B0D12] font-normal leading-tight">
                {product.name}
              </h1>

              {product.ratingCount > 0 && (
                <a href="#reviews" className="mt-2 inline-block">
                  <StarRating value={product.ratingAvg} count={product.ratingCount} />
                </a>
              )}

              {/* Pricing */}
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-[#0B0D12]">
                  {formatPKR(price)}
                </span>
                {discountPercent > 0 && (
                  <>
                    <span className="text-base text-[#8A8A8A] line-through">
                      {formatPKR(regularPrice)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Save {discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <p className="mt-2 text-xs text-[#575757]">
                Taxes included. Cash on Delivery payable at delivery.
              </p>

              {variant ? (
                <p
                  className={`mt-1 text-xs font-medium ${
                    stock <= 0 ? 'text-[#991B1B]' : stock <= 5 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {stockLabel(variant)}
                </p>
              ) : (
                <p className="mt-1 text-xs font-medium text-[#991B1B]">Currently unavailable</p>
              )}
            </div>

            {/* Short Description */}
            {topText && (
              <p className="text-sm text-[#575757] leading-relaxed border-t border-b border-[#E8DDD0] py-4">
                {topText}
              </p>
            )}

            {/* Color Selector */}
            {groups.colors.length > 0 && (
              <div className="space-y-2" role="group" aria-labelledby="color-label">
                <span id="color-label" className="text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider block">
                  Color / Finish:{' '}
                  <span className="text-[#B8893B] font-normal">{selectedColor}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {groups.colors.map((color) => {
                    const selected = selectedColor === color;
                    const available = colorAvailable(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={!available && !selected}
                        aria-pressed={selected}
                        onClick={() => choose({ color })}
                        className={`px-3.5 py-1.5 rounded text-xs font-medium border transition-all flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                          selected
                            ? 'border-[#0B0D12] bg-[#0B0D12] text-white shadow-xs'
                            : 'border-[#E8DDD0] bg-white text-[#1F1F1F] hover:border-[#B8893B]'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                        <span>{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector (if applicable) */}
            {groups.sizes.length > 0 && (
              <div className="space-y-2" role="group" aria-labelledby="size-label">
                <div className="flex items-center justify-between">
                  <span id="size-label" className="text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Size: <span className="text-[#B8893B] font-normal">{selectedSize}</span>
                  </span>
                  <span className="text-[11px] text-[#575757] italic">Standard US / PK Ring Sizing</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groups.sizes.map((size) => {
                    const selected = selectedSize === size;
                    const available = sizeAvailable(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!available && !selected}
                        aria-pressed={selected}
                        onClick={() => choose({ size })}
                        className={`px-3.5 py-1.5 rounded text-xs font-medium border transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                          selected
                            ? 'border-[#0B0D12] bg-[#0B0D12] text-white'
                            : 'border-[#E8DDD0] bg-white text-[#1F1F1F] hover:border-[#B8893B]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
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
                    onClick={() => setQuantity(Math.max(1, qty - 1))}
                    disabled={!canBuy || qty <= 1}
                    className="px-3 py-1.5 text-[#575757] hover:text-[#1F1F1F] transition-colors disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-semibold text-[#1F1F1F] min-w-[28px] text-center">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxQty, qty + 1))}
                    disabled={!canBuy || qty >= maxQty}
                    className="px-3 py-1.5 text-[#575757] hover:text-[#1F1F1F] transition-colors disabled:opacity-40"
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
                  disabled={!canBuy}
                  className="w-full py-3.5 px-4 bg-[#0B0D12] hover:bg-[#B8893B] disabled:bg-[#8A8A8A] disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-widest rounded-md active:scale-[0.97] motion-reduce:active:scale-100 transition-[color,background-color,transform] shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{canBuy ? 'Add to Bag' : 'Sold Out'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!canBuy}
                  className="w-full py-3.5 px-4 bg-[#B8893B] hover:bg-[#D9B66A] disabled:bg-[#E8DDD0] disabled:text-[#8A8A8A] disabled:cursor-not-allowed text-[#0B0D12] text-xs font-semibold uppercase tracking-widest rounded-md active:scale-[0.97] motion-reduce:active:scale-100 transition-[color,background-color,transform] shadow-md flex items-center justify-center gap-2"
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

            {/* Highlights */}
            {product.details.length > 0 && (
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
            )}
          </div>
        </div>

        {/* Long description and specifications */}
        {(showLongDescription || specRows.length > 0) && (
          <section aria-labelledby="about-heading" className="mt-16 pt-12 border-t border-[#B8893B]/20 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {showLongDescription && (
              <div className="lg:col-span-7">
                <h2 id="about-heading" className="font-serif text-2xl text-[#0B0D12] font-normal mb-4">
                  About This Piece
                </h2>
                <div className="space-y-4 text-sm text-[#575757] leading-relaxed">
                  {paragraphs.map((p, idx) => (
                    <p key={idx} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {specRows.length > 0 && (
              <div className={showLongDescription ? 'lg:col-span-5' : 'lg:col-span-12'}>
                <h2 className="font-serif text-2xl text-[#0B0D12] font-normal mb-4">Specifications</h2>
                <table className="w-full text-sm border border-[#E8DDD0] rounded-lg overflow-hidden">
                  <tbody>
                    {specRows.map((row, idx) => (
                      <tr key={`${row.name}-${idx}`} className="border-b border-[#E8DDD0] last:border-b-0 odd:bg-[#FAF7F2]">
                        <th scope="row" className="text-left font-semibold text-[#1F1F1F] px-4 py-2.5 w-2/5 align-top">
                          {row.name}
                        </th>
                        <td className="px-4 py-2.5 text-[#575757]">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Reviews */}
        <section id="reviews" className="mt-16 pt-12 border-t border-[#B8893B]/20 scroll-mt-24">
          <ReviewsSection
            productId={product.id}
            productName={product.name}
            reviews={reviews}
            ratingAvg={product.ratingAvg}
            ratingCount={product.ratingCount}
          />
        </section>

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
