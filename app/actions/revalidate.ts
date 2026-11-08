'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';

/** Rebuilds the static storefront pages after an admin edits products or settings. */
export async function revalidateStorefront() {
  if (!supabaseConfigured) return;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user?.app_metadata?.role !== 'admin') throw new Error('Forbidden');

  revalidatePath('/', 'layout');
}
