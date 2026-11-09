import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';

export const CONTACT_UNAVAILABLE = 'Messages are not available right now. Please message us on WhatsApp instead.';
const CONTACT_FAILED = 'We could not send your message. Please try again or message us on WhatsApp.';

export interface ContactInput {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Saves a Contact Us message through submit_contact() (supabase/schema.sql).
 * Returns an error message to show the visitor, or null when the message was saved.
 * `honeypot` is the hidden field real visitors leave empty.
 */
export async function submitContact(input: ContactInput, honeypot = ''): Promise<string | null> {
  if (!supabaseConfigured) return CONTACT_UNAVAILABLE;

  const { error } = await createClient().rpc('submit_contact', {
    p_name: input.fullName,
    p_phone: input.phone,
    p_email: input.email,
    p_subject: input.subject,
    p_message: input.message,
    p_hp: honeypot,
  });

  // P0001 is a message written for visitors inside the function; anything else is a server fault.
  if (error) return error.code === 'P0001' ? error.message : CONTACT_FAILED;
  return null;
}
