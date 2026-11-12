import { siteConfig } from '@/config/site';
import type { ContactMessage } from '@/types/product';

/**
 * International digits for a Pakistani number, as WhatsApp links need them:
 * "0300 1234567", "+92 300 1234567" and "0092 300 1234567" all become "923001234567".
 * Anything else is passed through as digits only.
 */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0092')) return digits.slice(2);
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('0')) return '92' + digits.slice(1);
  return digits;
}

/** A wa.me link that opens a chat with this number, optionally with the text ready to send. */
export function whatsappLink(phone: string, text?: string): string {
  return `https://wa.me/${toWhatsAppNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/**
 * The greeting that is ready in the WhatsApp chat when the team replies to a contact message
 * (admin Messages tab and the owner's alert email); the team can edit it before sending.
 */
export function contactReplyText(message: Pick<ContactMessage, 'fullName' | 'subject'>): string {
  return `Assalam o Alaikum ${message.fullName}! This is ${siteConfig.name} replying to your message "${message.subject}".`;
}
