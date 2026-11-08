import type { Product, Order, OrderStatus } from '@/types/product';
import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';
import { DEFAULT_SETTINGS, type AdminSettings } from '@/lib/settings';
import { rowToOrder, rowToProduct, type OrderRow, type ProductRow } from '@/lib/supabase/mappers';
import { BUCKET, productToSaveArgs, storagePathFromUrl, validateImageFile } from '@/lib/product-form';
import { revalidateStorefront } from '@/app/actions/revalidate';

export type { AdminSettings };

export interface DailyOrderVolume {
  date: string;
  dayLabel: string;
  fullDate: string;
  orders: number;
  revenue: number;
}

export function getDailyOrderVolume(orders: Order[]): DailyOrderVolume[] {
  const result: DailyOrderVolume[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);

    const dayOrders = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= d.getTime() && t < nextD.getTime();
    });

    const dayRevenue = dayOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    result.push({
      date: d.toISOString().split('T')[0],
      dayLabel: d.toLocaleDateString('en-PK', { weekday: 'short' }),
      fullDate: d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' }),
      orders: dayOrders.length,
      revenue: dayRevenue,
    });
  }

  return result;
}

// Every function below runs in the browser as the signed-in admin.
// Row Level Security (supabase/schema.sql) is what actually enforces "admin only".

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// RLS hides rows from a non-admin without raising an error, so an empty result means the write did not happen.
function requireRows(rows: unknown[] | null) {
  if (!rows?.length) {
    throw new Error('Nothing was changed. You may have been signed out; sign in again as an admin.');
  }
}

// Best effort: the database write already succeeded, and the storefront also refreshes itself on a timer.
async function refreshStorefront() {
  try {
    await revalidateStorefront();
  } catch (e) {
    console.warn('Storefront refresh failed', e);
  }
}

// --- AUTHENTICATION ---
export async function isAdminSession(): Promise<boolean> {
  if (!supabaseConfigured) return false;
  const { data } = await createClient().auth.getUser();
  return data.user?.app_metadata?.role === 'admin';
}

/** Returns an error message, or null on success. */
export async function adminSignIn(email: string, password: string): Promise<string | null> {
  if (!supabaseConfigured) {
    return 'Supabase is not configured yet. Add your URL and anon key to .env, then restart the server.';
  }
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return error.message;
  if (data.user.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut();
    return 'This account does not have admin access.';
  }
  return null;
}

export async function adminSignOut(): Promise<void> {
  await createClient().auth.signOut();
}

// --- ORDERS ---
export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await createClient()
    .from('orders')
    .select('*, order_events(*)')
    .order('created_at', { ascending: false })
    .limit(500);
  check(error);
  return (data as OrderRow[]).map(rowToOrder);
}

export async function updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<void> {
  const { data, error } = await createClient()
    .from('orders')
    .update({ status })
    .eq('order_number', orderNumber)
    .select('order_number');
  check(error);
  requireRows(data);
}

export async function deleteOrder(orderNumber: string): Promise<void> {
  const { data, error } = await createClient()
    .from('orders')
    .delete()
    .eq('order_number', orderNumber)
    .select('order_number');
  check(error);
  requireRows(data);
}

// --- PRODUCTS ---
const PRODUCT_SELECT = '*, product_variants(*)';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await createClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false });
  check(error);
  return (data as ProductRow[]).map(rowToProduct);
}

/** One product with all its variants (including inactive ones), or null if it no longer exists. */
export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await createClient().from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  check(error);
  return data ? rowToProduct(data as ProductRow) : null;
}

/** Creates or updates a product and its variants in one transaction. Returns the product id. */
export async function saveProduct(product: Product): Promise<string> {
  const { data, error } = await createClient().rpc('save_product', productToSaveArgs(product));
  check(error);
  await refreshStorefront();
  return data as string;
}

const MAX_SIDE = 1600;
const EXTENSIONS: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' };

/** Downscales to 1600px on the longest side and re-encodes as WebP (browsers without WebP encoding return PNG). */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process the image in this browser.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob) throw new Error('Could not process the image.');
  return blob;
}

/** Uploads one image to the product-images bucket under a random name and returns its public URL. */
export async function uploadProductImage(file: File): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);

  const blob = await resizeImage(file);
  const path = `${crypto.randomUUID()}.${EXTENSIONS[blob.type] ?? 'webp'}`;
  const storage = createClient().storage.from(BUCKET);
  const { error } = await storage.upload(path, blob, { contentType: blob.type, upsert: false });
  check(error);
  return storage.getPublicUrl(path).data.publicUrl;
}

/** Removes uploaded files from the bucket. URLs that are not ours (external images) are ignored; failures are only logged. */
export async function deleteProductImages(urls: string[]): Promise<void> {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => p !== null);
  if (paths.length === 0) return;
  const { error } = await createClient().storage.from(BUCKET).remove(paths);
  if (error) console.warn('Could not remove product images', error.message);
}

export async function deleteStoredProduct(id: string): Promise<void> {
  const supabase = createClient();
  // Read the image URLs first: once the product row is gone they cannot be looked up.
  const { data: row } = await supabase
    .from('products')
    .select('images, product_variants(image_url)')
    .eq('id', id)
    .maybeSingle();

  const { data, error } = await supabase.from('products').delete().eq('id', id).select('id');
  check(error);
  requireRows(data);

  const urls = [
    ...((row?.images as string[] | undefined) ?? []),
    ...(((row?.product_variants as { image_url: string | null }[] | undefined) ?? []).map((v) => v.image_url)),
  ].filter((u): u is string => Boolean(u));
  await deleteProductImages([...new Set(urls)]);
  await refreshStorefront();
}

// --- SETTINGS ---
export async function fetchSettings(): Promise<AdminSettings> {
  const { data, error } = await createClient().from('store_settings').select('data').maybeSingle();
  check(error);
  return { ...DEFAULT_SETTINGS, ...(data?.data ?? {}) };
}

// Sends the whole settings object (including couriers), so callers must pass every field.
export async function saveStoreSettings(settings: AdminSettings): Promise<void> {
  const { error } = await createClient().from('store_settings').upsert({ id: true, data: settings });
  check(error);
  await refreshStorefront();
}
