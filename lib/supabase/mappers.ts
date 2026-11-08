import type { Product, Order, OrderStatus } from '@/types/product';

// Database rows are snake_case; the app's types are camelCase. These are the only translators.

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: Product['category'];
  price: number;
  compare_at_price: number | null;
  images: string[];
  colors: string[];
  sizes: string[] | null;
  description: string;
  details: string[];
  tags: string[];
  is_new: boolean;
  is_best_seller: boolean;
  in_stock: boolean;
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
}

export const rowToProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  price: r.price,
  compareAtPrice: r.compare_at_price ?? undefined,
  images: r.images,
  colors: r.colors,
  sizes: r.sizes ?? undefined,
  description: r.description,
  details: r.details,
  tags: r.tags,
  isNew: r.is_new,
  isBestSeller: r.is_best_seller,
  inStock: r.in_stock,
});

// created_at is left out so an update keeps the original date (the database sets it on insert).
export const productToRow = (p: Product): ProductRow => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  category: p.category,
  price: p.price,
  compare_at_price: p.compareAtPrice ?? null,
  images: p.images,
  colors: p.colors,
  sizes: p.sizes ?? null,
  description: p.description,
  details: p.details,
  tags: p.tags,
  is_new: p.isNew,
  is_best_seller: p.isBestSeller,
  in_stock: p.inStock,
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
});
