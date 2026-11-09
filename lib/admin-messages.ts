import { createClient } from '@/lib/supabase/client';
import { rowToContactMessage, type ContactMessageRow } from '@/lib/supabase/mappers';
import type { ContactMessage } from '@/types/product';

// Runs in the browser as the signed-in admin; Row Level Security enforces "admin only".

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// RLS hides rows from a non-admin without an error, so an empty result means nothing changed.
function requireRows(rows: unknown[] | null) {
  if (!rows?.length) {
    throw new Error('Nothing was changed. You may have been signed out; sign in again as an admin.');
  }
}

export async function fetchMessages(): Promise<ContactMessage[]> {
  const { data, error } = await createClient()
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  check(error);
  return (data as ContactMessageRow[]).map(rowToContactMessage);
}

/** Cheap count for the sidebar badge: no message text is downloaded. */
export async function fetchNewMessageCount(): Promise<number> {
  const { count, error } = await createClient()
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new');
  check(error);
  return count ?? 0;
}

export async function setMessageStatus(id: string, status: ContactMessage['status']): Promise<void> {
  const { data, error } = await createClient().from('contact_messages').update({ status }).eq('id', id).select('id');
  check(error);
  requireRows(data);
}

export async function deleteMessage(id: string): Promise<void> {
  const { data, error } = await createClient().from('contact_messages').delete().eq('id', id).select('id');
  check(error);
  requireRows(data);
}
