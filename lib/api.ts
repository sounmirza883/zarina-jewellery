import { cache } from 'react';
import { PRODUCTS, CATEGORIES } from '@/data/products';
import { Product, ProductCategory, CategoryMeta } from '@/types/product';
import { createPublicClient } from '@/lib/supabase/public';
import { supabaseConfigured } from '@/lib/supabase/config';
import { rowToProduct, type ProductRow } from '@/lib/supabase/mappers';
import { DEFAULT_SETTINGS, type AdminSettings } from '@/lib/settings';

export interface ProductFilters {
  category?: ProductCategory | 'all';
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price-low' | 'price-high' | 'best-selling';
  search?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
}

/**
 * One catalogue read per request (React cache), newest first.
 * shortcut: without Supabase env vars the static seed catalogue is served so the site still runs locally; drop this once env is mandatory.
 */
const loadProducts = cache(async (): Promise<Product[]> => {
  if (!supabaseConfigured) return PRODUCTS;

  const { data, error } = await createPublicClient()
    .from('products')
    .select('*, product_variants(*)')
    .order('created_at', { ascending: false });
  if (error) {
    // The code can be deployed before supabase/schema.sql has been run: these codes mean the new tables
    // or columns are missing (PGRST200/205 = not in the schema cache, 42P01/42703 = undefined table/column).
    // Keep the site browsable with the built-in catalogue instead of failing the whole build.
    if (['PGRST200', 'PGRST205', '42P01', '42703'].includes(error.code)) {
      console.error(
        `[zarina] The database is missing the latest schema (${error.message}). ` +
          'Run supabase/schema.sql in the Supabase SQL Editor. Showing the built-in catalogue meanwhile.'
      );
      return PRODUCTS;
    }
    throw new Error(`Could not load products: ${error.message}`);
  }
  return (data as ProductRow[]).map(rowToProduct);
});

/**
 * Store settings edited in the admin Settings tab (shipping rules, announcement bar).
 */
export const getSiteSettings = cache(async (): Promise<AdminSettings> => {
  if (!supabaseConfigured) return DEFAULT_SETTINGS;

  const { data, error } = await createPublicClient().from('store_settings').select('data').maybeSingle();
  if (error) {
    // Settings only tune shipping and the announcement bar, so a failure must not take the whole site down.
    console.error(`Could not load settings: ${error.message}`);
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...(data?.data ?? {}) };
});

/**
 * Returns products matching provided filters, sorting, and search.
 */
export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let list = [...(await loadProducts())];

  // Category filter
  if (filters.category && filters.category !== 'all') {
    list = list.filter((p) => p.category === filters.category);
  }

  // Price range filter
  if (typeof filters.minPrice === 'number') {
    list = list.filter((p) => p.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === 'number') {
    list = list.filter((p) => p.price <= filters.maxPrice!);
  }

  // New arrivals flag
  if (filters.isNew) {
    list = list.filter((p) => p.isNew);
  }

  // Best sellers flag
  if (filters.isBestSeller) {
    list = list.filter((p) => p.isBestSeller);
  }

  // Search query
  if (filters.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
    list = list.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchCategory || matchTags;
    });
  }

  // Sort
  if (filters.sort === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (filters.sort === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (filters.sort === 'best-selling') {
    list.sort((a, b) => (b.isBestSeller === a.isBestSeller ? 0 : b.isBestSeller ? 1 : -1));
  } else {
    // Default newest: products with isNew true first, or preserve catalogue order
    list.sort((a, b) => (b.isNew === a.isNew ? 0 : b.isNew ? 1 : -1));
  }

  return list;
}

/**
 * Returns a single product by slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = (await loadProducts()).find((p) => p.slug === slug);
  return product || null;
}

/**
 * Returns products in a specific category.
 */
export async function getProductsByCategory(category: ProductCategory): Promise<Product[]> {
  return getProducts({ category });
}

/**
 * Returns products matching search query.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  return getProducts({ search: query });
}

/**
 * Returns New Arrivals.
 */
export async function getNewArrivals(limit: number = 8): Promise<Product[]> {
  const items = await getProducts({ isNew: true });
  return items.slice(0, limit);
}

/**
 * Returns Best Sellers.
 */
export async function getBestSellers(limit: number = 8): Promise<Product[]> {
  const items = await getProducts({ isBestSeller: true });
  return items.slice(0, limit);
}

/**
 * Returns related products for a product page.
 */
export async function getRelatedProducts(
  currentProductId: string,
  category: ProductCategory,
  limit: number = 4
): Promise<Product[]> {
  const categoryProducts = await getProductsByCategory(category);
  const filtered = categoryProducts.filter((p) => p.id !== currentProductId);
  return filtered.slice(0, limit);
}

/**
 * Returns all categories metadata.
 */
export async function getCategories(): Promise<CategoryMeta[]> {
  return CATEGORIES;
}
