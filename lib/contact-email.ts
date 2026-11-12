import type { ContactMessage } from '@/types/product';
import { siteConfig } from '@/config/site';
import { sendEmail } from './resend';
import { isPlainEmail } from './shop-logic';
import { contactReplyText, whatsappLink } from './whatsapp';
import {
  type BuiltEmail,
  GOLD,
  SITE_URL,
  buttonLink,
  escapeHtml,
  heading,
  multiline,
  oneLine,
  section,
  shell,
  supportEmailFrom,
  supportRecipients,
} from './email-shared';

// The two emails sent when a Contact Us message arrives: a confirmation to the visitor and an alert to
// the support team. Both are built from the row that submit_contact() returned (never from what the
// browser sent), both go out after the response, and neither can lose the saved message: it is already
// in the admin Messages tab whether or not an email arrives.

/** The alert for the support team and admin. Every visitor-typed value is escaped. */
export function contactSupportEmail(message: ContactMessage): BuiltEmail {
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
      `<p style="margin:0;font-size:14px;color:#575757">It is saved in the admin Messages tab. Reply on WhatsApp, by phone or by email, then mark it handled.</p>` +
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

/**
 * The confirmation the visitor gets. On purpose it does NOT repeat their subject or message: anyone can
 * type someone else's address, and that person must not receive text they never wrote from our domain.
 */
export function contactCustomerEmail(message: ContactMessage): BuiltEmail {
  const firstName = oneLine(message.fullName).split(' ')[0] || 'there';
  const { whatsappDisplay, whatsappUrl, workingHours } = siteConfig.contact;

  const html = shell(
    'We have received your message',
    heading(`Thank you, ${escapeHtml(firstName)}!`) +
      `<p style="margin:0 0 4px;font-size:14px;line-height:1.6">We have received your query. Our support team will contact you very soon on <strong>${escapeHtml(message.phone)}</strong> or by email.</p>` +
      section(
        'Need us sooner?',
        `Message us on WhatsApp: <a href="${escapeHtml(whatsappUrl)}" style="color:${GOLD}">${escapeHtml(whatsappDisplay)}</a><br>Customer care hours: ${escapeHtml(workingHours)}`
      ) +
      `<p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#575757">You can reply to this email to reach our support team.<br>If you did not send us a message, you can ignore this email.</p>`
  );

  const text = [
    `Thank you, ${firstName}!`,
    '',
    `We have received your query. Our support team will contact you very soon on ${message.phone} or by email.`,
    '',
    `Need us sooner? Message us on WhatsApp: ${whatsappDisplay}`,
    `Customer care hours: ${workingHours}`,
    '',
    'You can reply to this email to reach our support team.',
    'If you did not send us a message, you can ignore this email.',
  ].join('\n');

  return { subject: `We have received your message - ${siteConfig.name}`, html, text };
}

/**
 * The visitor's email when it is safe to use (a plain address that the email provider will accept),
 * otherwise undefined. Older saved messages may have no email at all.
 */
export const replyToFor = (email: string): string | undefined => (isPlainEmail(email) ? email.trim() : undefined);

/**
 * Sends the confirmation to the visitor and the alert to the support team (SUPPORT_NOTIFY_EMAIL, or
 * ORDER_NOTIFY_EMAIL when that is empty), both from SUPPORT_EMAIL_FROM. Replying to the confirmation
 * reaches the support team; replying to the alert reaches the visitor. Never throws: an email problem
 * must not affect the message that was saved, and one email failing does not stop the other.
 */
export async function sendContactEmails(message: ContactMessage, send: typeof sendEmail = sendEmail): Promise<void> {
  try {
    const from = supportEmailFrom();
    const support = supportRecipients();
    const visitor = replyToFor(message.email);

    const jobs: Array<Promise<boolean>> = [];
    if (visitor) {
      jobs.push(
        send({ from, to: visitor, replyTo: support, ...contactCustomerEmail(message), idempotencyKey: `contact-${message.id}-customer` })
      );
    }
    if (support.length > 0) {
      jobs.push(
        send({ from, to: support, replyTo: visitor, ...contactSupportEmail(message), idempotencyKey: `contact-${message.id}-support` })
      );
    } else {
      console.warn('SUPPORT_NOTIFY_EMAIL is not set (and neither is ORDER_NOTIFY_EMAIL): no support alert was sent.');
    }

    for (const result of await Promise.allSettled(jobs)) {
      if (result.status === 'rejected') {
        console.error('Contact-message email failed:', result.reason instanceof Error ? result.reason.message : result.reason);
      }
    }
  } catch (err) {
    console.error('Contact-message emails failed:', err instanceof Error ? err.message : err);
  }
}
