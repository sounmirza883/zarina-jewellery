'use server';

import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { rowToContactMessage, type ContactMessageRow } from '@/lib/supabase/mappers';
import { sendContactEmails } from '@/lib/contact-email';

export interface ContactInput {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

export type SendContactResult = { ok: true } | { error: string };

const CONTACT_UNAVAILABLE = 'Messages are not available right now. Please message us on WhatsApp instead.';
const CONTACT_FAILED = 'We could not send your message. Please try again or message us on WhatsApp.';

/**
 * Saves a Contact Us message with submit_contact (checks, spam guards and limits all stay in the
 * database), then emails the visitor a confirmation and the support team an alert. It runs on the server
 * so the Resend key stays secret and the emails are built from the row the database saved. They go out
 * after the response, so an email problem can never lose the message: it is already in the admin
 * Messages tab.
 * `honeypot` is the hidden field real visitors leave empty.
 */
export async function sendContactMessage(input: ContactInput, honeypot = ''): Promise<SendContactResult> {
  if (!supabaseConfigured) {
    return { error: CONTACT_UNAVAILABLE };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('submit_contact', {
      p_name: input.fullName,
      p_phone: input.phone,
      p_email: input.email,
      p_subject: input.subject,
      p_message: input.message,
      p_hp: honeypot,
    });

    if (error) {
      // P0001 is a message written for visitors inside submit_contact; anything else is a server fault.
      return { error: error.code === 'P0001' ? error.message : CONTACT_FAILED };
    }

    // null means the honeypot was filled: nothing was saved, and the bot is told it worked.
    if (data) {
      const message = rowToContactMessage(data as ContactMessageRow);
      after(() => sendContactEmails(message));
    }
    return { ok: true };
  } catch {
    return { error: CONTACT_FAILED };
  }
}
