import type { ContactMessage } from '@/types/product';
import { sendEmail } from './resend';
import { contactReplyText, whatsappLink } from './whatsapp';
import {
  type BuiltEmail,
  GOLD,
  SITE_URL,
  buttonLink,
  emailFrom,
  escapeHtml,
  heading,
  multiline,
  notifyRecipients,
  oneLine,
  section,
  shell,
} from './email-shared';

// The "new contact message" alert for the shop owner. It is built from the row that submit_contact()
// returned (never from what the browser sent), it is sent after the response, and it can never lose
// the saved message: the message is already in the admin Messages tab whether or not this email arrives.

/** The alert email for one saved contact message. Every visitor-typed value is escaped. */
export function contactOwnerEmail(message: ContactMessage): BuiltEmail {
  const wa = whatsappLink(message.phone, contactReplyText(message));
  const tel = message.phone.replace(/[^\d+]/g, '');
  const adminUrl = `${SITE_URL}/admin`;

  const fromHtml = [
    `<strong>${escapeHtml(message.fullName)}</strong>`,
    `Phone: <a href="tel:${escapeHtml(tel)}" style="color:${GOLD}">${escapeHtml(message.phone)}</a>`,
    `WhatsApp: <a href="${escapeHtml(wa)}" style="color:${GOLD}">Open chat</a>`,
    message.email ? `Email: ${escapeHtml(message.email)}` : '',
  ]
    .filter(Boolean)
    .join('<br>');

  const html = shell(
    `New message: ${message.subject}`,
    heading('New contact message') +
      `<p style="margin:0;font-size:14px;color:#575757">It is saved in the admin Messages tab. Reply on WhatsApp or by phone, then mark it handled.</p>` +
      section('From', fromHtml) +
      section('Subject', escapeHtml(message.subject)) +
      section('Message', multiline(message.message)) +
      buttonLink(adminUrl, 'OPEN ADMIN')
  );

  const text = [
    'New contact message (saved in the admin Messages tab)',
    '',
    message.fullName,
    `Phone: ${message.phone}`,
    `WhatsApp: ${wa}`,
    ...(message.email ? [`Email: ${message.email}`] : []),
    '',
    `Subject: ${message.subject}`,
    '',
    message.message,
    '',
    `Admin: ${adminUrl}`,
  ].join('\n');

  return {
    subject: `New message: ${oneLine(message.subject)} - ${oneLine(message.fullName)}`,
    html,
    text,
  };
}

// submit_contact's email check is loose (it allows quotes, commas and angle brackets). Resend refuses
// such a reply-to and the whole alert would be lost, so only a plain address becomes the reply-to;
// any other address is still shown (escaped) in the email body.
const PLAIN_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/** The visitor's email when it is safe to use as Reply-To, otherwise undefined. */
export const replyToFor = (email: string): string | undefined => {
  const address = email.trim();
  return PLAIN_EMAIL.test(address) ? address : undefined;
};

/**
 * Emails the owner (ORDER_NOTIFY_EMAIL) about a saved contact message. Replying goes to the visitor
 * when they gave an email. Never throws: an email problem must not affect the message that was saved.
 */
export async function sendContactAlert(message: ContactMessage, send: typeof sendEmail = sendEmail): Promise<void> {
  const owners = notifyRecipients();
  if (owners.length === 0) {
    console.warn('ORDER_NOTIFY_EMAIL is not set: no contact-message alert was sent.');
    return;
  }

  try {
    await send({
      from: emailFrom(),
      to: owners,
      replyTo: replyToFor(message.email),
      ...contactOwnerEmail(message),
      idempotencyKey: `contact-${message.id}`,
    });
  } catch (err) {
    console.error('Contact-message alert failed:', err instanceof Error ? err.message : err);
  }
}
