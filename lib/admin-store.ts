import { PRODUCTS } from '@/data/products';
import type { Product, Order, OrderStatus } from '@/types/product';
import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';
import { DEFAULT_SETTINGS, type AdminSettings } from '@/lib/settings';
import {
  productToRow,
  rowToOrder,
  rowToProduct,
  type OrderRow,
  type ProductRow,
} from '@/lib/supabase/mappers';
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
    .select('*')
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
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await createClient()
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  check(error);
  return (data as ProductRow[]).map(rowToProduct);
}

export async function upsertProduct(product: Product): Promise<void> {
  const { error } = await createClient().from('products').upsert(productToRow(product));
  check(error);
  await refreshStorefront();
}

export async function deleteStoredProduct(id: string): Promise<void> {
  const { data, error } = await createClient().from('products').delete().eq('id', id).select('id');
  check(error);
  requireRows(data);
  await refreshStorefront();
}

/** Removes custom products and restores the 16 seed products to their original values. */
export async function resetProductsToDefault(): Promise<void> {
  const supabase = createClient();
  const seedIds = PRODUCTS.map((p) => p.id);
  const removed = await supabase.from('products').delete().not('id', 'in', `(${seedIds.join(',')})`);
  check(removed.error);
  const restored = await supabase.from('products').upsert(PRODUCTS.map(productToRow));
  check(restored.error);
  await refreshStorefront();
}

// --- SETTINGS ---
export async function fetchSettings(): Promise<AdminSettings> {
  const { data, error } = await createClient().from('store_settings').select('data').maybeSingle();
  check(error);
  return { ...DEFAULT_SETTINGS, ...(data?.data ?? {}) };
}

export async function saveStoreSettings(settings: AdminSettings): Promise<void> {
  const { error } = await createClient().from('store_settings').upsert({ id: true, data: settings });
  check(error);
  await refreshStorefront();
}
