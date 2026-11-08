import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';
import {
  rowToOrder,
  rowToProfile,
  type OrderRow,
  type ProfileRow,
} from '@/lib/supabase/mappers';
import type { Order, Profile } from '@/types/product';

// Customer-side auth and account data. Browser only: every call runs as the signed-in customer and
// Row Level Security (supabase/schema.sql) decides what they may see.

export const NOT_CONFIGURED =
  'Accounts are not available right now. You can still shop as a guest or message us on WhatsApp.';

export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  if (!supabaseConfigured) return null;
  const { data } = await createClient().auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null;
}

/**
 * Cheap "is someone signed in" flag for the header and menu icons. It reads the locally stored
 * session (no network call) and follows sign-in/out. UI hint only: pages and RLS verify for real.
 */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!supabaseConfigured) return;
    const { data } = createClient().auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

// ---- auth actions: each returns an error message, or null on success ----

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function signUp(
  fullName: string,
  email: string,
  password: string
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED, needsConfirmation: false };
  const { data, error } = await createClient().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message, needsConfirmation: false };
  // No session yet means the project requires email confirmation.
  return { error: null, needsConfirmation: !data.session };
}

export async function requestPasswordReset(email: string): Promise<string | null> {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  const { error } = await createClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  });
  return error ? error.message : null;
}

export async function updatePassword(password: string): Promise<string | null> {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  const { error } = await createClient().auth.updateUser({ password });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  if (supabaseConfigured) await createClient().auth.signOut();
}

// ---- profile and orders ----

export async function fetchMyProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await createClient().from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function saveMyProfile(p: Omit<Profile, 'id'>): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Please sign in again.');
  const { error } = await createClient()
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: p.fullName,
      phone: p.phone,
      province: p.province,
      city: p.city,
      address: p.address,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}

/** The signed-in customer's own orders, newest first (an admin signed in here still sees only their own). */
export async function fetchMyOrders(): Promise<Order[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await createClient()
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data as OrderRow[]).map(rowToOrder);
}
