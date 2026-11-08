import type {
  Coupon,
  Order,
  OrderStatus,
  Product,
  ProductAttribute,
  ProductVariant,
  Profile,
  Review,
} from '@/types/product';

// Database rows are snake_case; the app's types are camelCase. These are the only translators.

export interface VariantRow {
  id: string;
  product_id: string;
  sku: string | null;
  color: string;
  size: string;
  regular_price: number;
  sale_price: number | null;
  stock_qty: number;
  image_url: string | null;
  position: number;
  active: boolean;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: Product['category'];
  price: number;
  regular_price: number | null;
  sale_price: number | null;
  compare_at_price: number | null;
  short_description: string;
  description: string;
  details: string[];
  attributes: ProductAttribute[];
  tags: string[];
  images: string[];
  colors: string[];
  sizes: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[];
  og_image: string | null;
  is_new: boolean;
  is_best_seller: boolean;
  in_stock: boolean;
  rating_avg: number | string;
  rating_count: number;
  updated_at: string | null;
  /** Present when queried with select('*, product_variants(*)'). */
  product_variants?: VariantRow[] | null;
}

export interface OrderRow {
  order_number: string;
  items: Order['items'];
  subtotal: number;
  shipping: number;
  total: number;
  customer: Order['customer'];
  status: OrderStatus;
  created_at: string;
  user_id: string | null;
  discount: number;
  coupon_code: string | null;
}

export interface CouponRow {
  code: string;
  kind: Coupon['kind'];
  value: number;
  categories: Coupon['categories'];
  min_subtotal: number;
  include_sale_items: boolean;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  once_per_customer: boolean;
  active: boolean;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  product_id: string;
  rating: number;
  author_name: string;
  title: string;
  body: string;
  status: 'pending' | 'approved';
  is_verified: boolean;
  created_at: string;
  /** Present when queried with select('*, products(name)'). */
  products?: { name: string } | null;
}

export interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
}

export const rowToVariant = (r: VariantRow): ProductVariant => ({
  id: r.id,
  sku: r.sku,
  color: r.color,
  size: r.size,
  regularPrice: r.regular_price,
  salePrice: r.sale_price ?? undefined,
  stockQty: r.stock_qty,
  imageUrl: r.image_url ?? undefined,
  position: r.position,
  active: r.active,
});

export const rowToProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  price: r.price,
  regularPrice: r.regular_price ?? r.price,
  salePrice: r.sale_price ?? undefined,
  compareAtPrice: r.compare_at_price ?? undefined,
  shortDescription: r.short_description ?? '',
  description: r.description ?? '',
  details: r.details ?? [],
  attributes: r.attributes ?? [],
  tags: r.tags ?? [],
  images: r.images ?? [],
  colors: r.colors ?? [],
  sizes: r.sizes ?? undefined,
  variants: (r.product_variants ?? []).map(rowToVariant).sort((a, b) => a.position - b.position),
  metaTitle: r.meta_title ?? undefined,
  metaDescription: r.meta_description ?? undefined,
  metaKeywords: r.meta_keywords ?? [],
  ogImage: r.og_image ?? undefined,
  isNew: r.is_new,
  isBestSeller: r.is_best_seller,
  inStock: r.in_stock,
  ratingAvg: Number(r.rating_avg ?? 0),
  ratingCount: r.rating_count ?? 0,
  updatedAt: r.updated_at ?? undefined,
});

export const rowToOrder = (r: OrderRow): Order => ({
  orderNumber: r.order_number,
  items: r.items,
  subtotal: r.subtotal,
  shipping: r.shipping,
  total: r.total,
  customer: r.customer,
  createdAt: r.created_at,
  paymentMethod: 'Cash on Delivery',
  status: r.status,
  userId: r.user_id,
  discount: r.discount ?? 0,
  couponCode: r.coupon_code,
});

export const rowToCoupon = (r: CouponRow): Coupon => ({
  code: r.code,
  kind: r.kind,
  value: r.value,
  categories: r.categories ?? [],
  minSubtotal: r.min_subtotal,
  includeSaleItems: r.include_sale_items,
  startsAt: r.starts_at ?? undefined,
  expiresAt: r.expires_at ?? undefined,
  usageLimit: r.usage_limit ?? undefined,
  oncePerCustomer: r.once_per_customer,
  active: r.active,
  createdAt: r.created_at,
});

export const rowToReview = (r: ReviewRow): Review => ({
  id: r.id,
  productId: r.product_id,
  rating: r.rating,
  authorName: r.author_name,
  title: r.title,
  body: r.body,
  status: r.status,
  isVerified: r.is_verified,
  createdAt: r.created_at,
  productName: r.products?.name,
});

export const rowToProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  fullName: r.full_name,
  phone: r.phone,
  province: r.province,
  city: r.city,
  address: r.address,
});
