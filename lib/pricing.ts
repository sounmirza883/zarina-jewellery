import type { CartItem, Product, ProductVariant } from '@/types/product';

// Pure helpers for prices, variants and stock. Used by server and client code alike.

const byPosition = (a: ProductVariant, b: ProductVariant) => a.position - b.position;

/** Selling price of one variant: its sale price when set, otherwise its regular price. */
export const variantPrice = (v: ProductVariant): number => v.salePrice ?? v.regularPrice;

export const variantOnSale = (v: ProductVariant): boolean =>
  v.salePrice !== undefined && v.salePrice < v.regularPrice;

/** Whole-number discount percentage, 0 when there is no discount. */
export function discountPercent(regular: number, price: number): number {
  if (regular <= 0 || price >= regular) return 0;
  return Math.round(((regular - price) / regular) * 100);
}

/** Active variants in display order. */
export const activeVariants = (p: Pick<Product, 'variants'>): ProductVariant[] =>
  p.variants.filter((v) => v.active).sort(byPosition);

/** "Gold-tone / 7", or "Default" for a product without options. */
export function variantLabel(v: Pick<ProductVariant, 'color' | 'size'>): string {
  const parts = [v.color, v.size].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'Default';
}

/** Distinct colour and size choices, in display order, ignoring empty values. */
export function optionGroups(variants: ProductVariant[]): { colors: string[]; sizes: string[] } {
  const ordered = variants.filter((v) => v.active).sort(byPosition);
  const distinct = (pick: (v: ProductVariant) => string) =>
    ordered.map(pick).filter((value, i, all) => value !== '' && all.indexOf(value) === i);
  return { colors: distinct((v) => v.color), sizes: distinct((v) => v.size) };
}

/** The active variant with exactly this colour and size ('' means "no such option"). */
export const findVariant = (
  variants: ProductVariant[],
  color: string,
  size: string
): ProductVariant | undefined => variants.find((v) => v.active && v.color === color && v.size === size);

export const totalStock = (p: Pick<Product, 'variants'>): number =>
  activeVariants(p).reduce((sum, v) => sum + v.stockQty, 0);

/** Listed in the shop and at least one active variant is in stock. */
export const isPurchasable = (p: Pick<Product, 'inStock' | 'variants'>): boolean =>
  p.inStock && totalStock(p) > 0;

/** First in-stock active variant, else the first active one. */
export function defaultVariant(p: Pick<Product, 'variants'>): ProductVariant | undefined {
  const active = activeVariants(p);
  return active.find((v) => v.stockQty > 0) ?? active[0];
}

/** Lowest and highest selling price across active variants (falls back to the product price). */
export function priceRange(p: Pick<Product, 'variants' | 'price'>): { min: number; max: number; hasRange: boolean } {
  const prices = activeVariants(p).map(variantPrice);
  if (prices.length === 0) return { min: p.price, max: p.price, hasRange: false };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, hasRange: min !== max };
}

export function stockLabel(v: Pick<ProductVariant, 'stockQty'>): string {
  if (v.stockQty <= 0) return 'Out of stock';
  if (v.stockQty <= 5) return `Only ${v.stockQty} left`;
  return 'In stock';
}

/** Unit price of a bag line; older order snapshots have no unitPrice. */
export const lineUnitPrice = (item: Pick<CartItem, 'unitPrice' | 'product'>): number =>
  item.unitPrice ?? item.product.price;
