export type ProductCategory = 'earrings' | 'necklaces' | 'rings' | 'bracelets';

export interface ProductAttribute {
  name: string;
  value: string;
}

/** One purchasable colour/size combination. Simple products have a single variant with empty color and size. */
export interface ProductVariant {
  id: string;
  sku: string | null;
  color: string; // '' when the product has no colour options
  size: string; // '' when the product has no size options
  regularPrice: number;
  salePrice?: number; // only set when below regularPrice
  stockQty: number;
  imageUrl?: string;
  position: number;
  active: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  /** Selling price: the sale price when there is one, otherwise the regular price. */
  price: number;
  regularPrice: number;
  salePrice?: number;
  /** Equals regularPrice while on sale. Kept for older consumers. */
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  /** Highlight bullets. */
  details: string[];
  /** Name/value specs, for example Material: Brass. */
  attributes: ProductAttribute[];
  tags: string[];
  images: string[];
  /** Kept in sync with the variants by the database. */
  colors: string[];
  sizes?: string[];
  variants: ProductVariant[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
  ogImage?: string;
  isNew: boolean;
  isBestSeller: boolean;
  /** "Listed in the shop" switch. Sold out is derived from variant stock (see lib/pricing.ts). */
  inStock: boolean;
  ratingAvg: number;
  ratingCount: number;
  updatedAt?: string;
}

/**
 * A bag line. The variant fields are always set for new carts and orders; they are optional only so
 * older order snapshots (placed before variants existed) still type-check. Use lineUnitPrice().
 */
export interface CartItem {
  cartItemId: string; // the variant id for new carts
  variantId?: string;
  sku?: string;
  variantLabel?: string;
  unitPrice?: number;
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize?: string;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  province: string;
  city: string;
  address: string;
  notes?: string;
}

export type OrderStatus =
  | 'Pending Phone Confirmation'
  | 'Confirmed'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: CustomerDetails;
  createdAt: string;
  paymentMethod: 'Cash on Delivery';
  status: OrderStatus;
  userId?: string | null;
  /** Rupees taken off the items by a coupon (0 or missing when none was used). */
  discount?: number;
  couponCode?: string | null;
}

export type CouponKind = 'percent' | 'fixed' | 'free_shipping';

export interface Coupon {
  code: string;
  kind: CouponKind;
  /** percent: 1-100, fixed: rupees, free_shipping: 0 */
  value: number;
  /** Empty = every category. */
  categories: ProductCategory[];
  /** Minimum spend on the eligible items. */
  minSubtotal: number;
  includeSaleItems: boolean;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  oncePerCustomer: boolean;
  active: boolean;
  createdAt: string;
}

/** What validate_coupon returns for the checkout page. */
export interface CouponPreview {
  code: string;
  kind: CouponKind;
  value: number;
  discount: number;
  freeShipping: boolean;
}

export interface Review {
  id: string;
  productId: string;
  rating: number; // 1..5
  authorName: string;
  title: string;
  body: string;
  status: 'pending' | 'approved';
  isVerified: boolean;
  createdAt: string;
  /** Filled by admin queries that join the product. */
  productName?: string;
}

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
}

export interface CategoryMeta {
  id: ProductCategory;
  name: string;
  slug: string;
  description: string;
  image: string;
  count?: number;
}
