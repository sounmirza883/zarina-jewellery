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
