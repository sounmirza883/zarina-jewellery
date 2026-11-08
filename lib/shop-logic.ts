import { CartItem } from '@/types/product';
import { lineUnitPrice } from './pricing';

/** place_order accepts at most this many of one variant per order. */
export const MAX_PER_ITEM = 20;

/**
 * Formats numeric price into Pakistani Rupee string (e.g., Rs. 2,450)
 */
export function formatPKR(amount: number): string {
  const rounded = Math.round(amount);
  return `Rs. ${rounded.toLocaleString('en-PK')}`;
}

/**
 * Calculates cart subtotal, shipping cost, and grand total.
 */
export function calculateCartTotals(
  items: CartItem[],
  flatShipping: number = 250,
  freeShippingThreshold: number = 3500
): {
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingRemaining: number;
  isFreeShipping: boolean;
  totalItemCount: number;
} {
  const subtotal = items.reduce(
    (acc, item) => acc + lineUnitPrice(item) * item.quantity,
    0
  );
  
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const isFreeShipping = subtotal >= freeShippingThreshold && items.length > 0;
  const shipping = items.length === 0 ? 0 : isFreeShipping ? 0 : flatShipping;
  const total = subtotal + shipping;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

  return {
    subtotal,
    shipping,
    total,
    freeShippingRemaining,
    isFreeShipping,
    totalItemCount,
  };
}

/**
 * Validates a Pakistani mobile phone number.
 * Accepts formats:
 * - 03001234567
 * - 0300-1234567
 * - 0300 1234567
 * - +923001234567
 * - 00923001234567
 */
export function isValidPakistaniPhone(phone: string): boolean {
  if (!phone) return false;
  // Strip spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Pattern 1: 03XXXXXXXXX (11 digits starting with 03)
  const localRegex = /^03\d{9}$/;
  // Pattern 2: +923XXXXXXXXX (13 chars starting with +923)
  const intlRegex = /^\+923\d{9}$/;
  // Pattern 3: 923XXXXXXXXX (12 chars starting with 923)
  const intlNoPlusRegex = /^923\d{9}$/;
  // Pattern 4: 00923XXXXXXXXX (14 chars)
  const intlZeroZeroRegex = /^00923\d{9}$/;

  return (
    localRegex.test(cleaned) ||
    intlRegex.test(cleaned) ||
    intlNoPlusRegex.test(cleaned) ||
    intlZeroZeroRegex.test(cleaned)
  );
}

/**
 * Normalizes phone number into standard local Pakistani format (03001234567)
 */
export function normalizePakistaniPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (/^03\d{9}$/.test(cleaned)) return cleaned;
  if (/^\+923\d{9}$/.test(cleaned)) return '0' + cleaned.substring(3);
  if (/^923\d{9}$/.test(cleaned)) return '0' + cleaned.substring(2);
  if (/^00923\d{9}$/.test(cleaned)) return '0' + cleaned.substring(4);
  return cleaned;
}

/**
 * Most units of a bag line the customer can ask for: the variant's stock when it was added, capped.
 */
export function maxQuantity(item: Pick<CartItem, 'variantId' | 'product'>): number {
  const stock = item.product.variants.find((v) => v.id === item.variantId)?.stockQty;
  return Math.min(MAX_PER_ITEM, stock ?? MAX_PER_ITEM);
}

/**
 * "Gold-tone / 7", or "Default" for a product without options. Older order snapshots have no variantLabel.
 */
export function cartItemLabel(
  item: Pick<CartItem, 'variantLabel' | 'selectedColor' | 'selectedSize'>
): string {
  return (
    item.variantLabel ??
    ([item.selectedColor, item.selectedSize].filter(Boolean).join(' / ') || 'Default')
  );
}
