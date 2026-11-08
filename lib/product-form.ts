import type { Product, ProductAttribute, ProductCategory, ProductVariant } from '../types/product';

// Pure helpers behind the admin product editor: form state <-> Product, validation, variants, images.

export const BUCKET = 'product-images';
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches the bucket limit, checked before resizing
export const MAX_IMAGES = 8;
export const META_TITLE_MAX = 120;
export const META_DESCRIPTION_MAX = 320;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Inputs are kept as strings so a field can be empty while typing. */
export interface VariantForm {
  id?: string; // set for variants that already exist in the database
  sku: string;
  color: string;
  size: string;
  regularPrice: string;
  salePrice: string;
  stockQty: string;
  imageUrl: string;
  active: boolean;
}

export interface ProductForm {
  id?: string;
  name: string;
  slug: string;
  category: ProductCategory;
  isNew: boolean;
  isBestSeller: boolean;
  inStock: boolean; // "listed in the shop"
  shortDescription: string;
  description: string;
  details: string; // one highlight per line
  tags: string; // comma separated
  regularPrice: string;
  salePrice: string;
  colors: string; // comma separated
  sizes: string; // comma separated
  variants: VariantForm[];
  images: string[];
  attributes: ProductAttribute[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string; // comma separated
  ogImage: string;
}

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Only JPEG, PNG or WebP images are allowed.';
  if (file.size > MAX_IMAGE_BYTES) return 'Each image must be 5 MB or smaller.';
  return null;
}

/** Object path inside our bucket for a public URL, or null for any other URL (e.g. external images). */
export function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;
  const path = decodeURIComponent(url.slice(at + marker.length).split('?')[0]);
  return path || null;
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= list.length || from < 0 || from >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);

/** Comma separated text -> trimmed, unique, non-empty values. */
export const splitList = (text: string): string[] =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter((s, i, all) => s !== '' && all.indexOf(s) === i);

const splitLines = (text: string): string[] =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const toInt = (text: string): number | null => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : null);

const distinct = (values: string[]): string[] => values.filter((v, i, all) => v !== '' && all.indexOf(v) === i);

/**
 * Colour x size combinations. Combinations that already exist keep their id, SKU, stock and image;
 * new ones start from the product prices with 0 stock. Combinations no longer listed are dropped
 * (the database deactivates them when the product is saved).
 */
export function buildVariants(
  colors: string[],
  sizes: string[],
  existing: VariantForm[],
  defaults: { regularPrice: string; salePrice: string }
): VariantForm[] {
  const out: VariantForm[] = [];
  for (const color of colors.length > 0 ? colors : ['']) {
    for (const size of sizes.length > 0 ? sizes : ['']) {
      out.push(
        existing.find((v) => v.color === color && v.size === size) ?? {
          sku: '',
          color,
          size,
          regularPrice: defaults.regularPrice,
          salePrice: defaults.salePrice,
          stockQty: '0',
          imageUrl: '',
          active: true,
        }
      );
    }
  }
  return out;
}

/** Variants whose price still equals the product's old price follow the new one; explicit overrides stay. */
export function followProductPrices(
  variants: VariantForm[],
  prev: { regularPrice: string; salePrice: string },
  next: { regularPrice: string; salePrice: string }
): VariantForm[] {
  return variants.map((v) => ({
    ...v,
    regularPrice: v.regularPrice === prev.regularPrice || v.regularPrice === '' ? next.regularPrice : v.regularPrice,
    salePrice: v.salePrice === prev.salePrice ? next.salePrice : v.salePrice,
  }));
}

export function emptyForm(): ProductForm {
  return {
    name: '',
    slug: '',
    category: 'earrings',
    isNew: true,
    isBestSeller: false,
    inStock: true,
    shortDescription: '',
    description: '',
    details: '',
    tags: '',
    regularPrice: '',
    salePrice: '',
    colors: '',
    sizes: '',
    variants: buildVariants([], [], [], { regularPrice: '', salePrice: '' }),
    images: [],
    attributes: [],
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogImage: '',
  };
}

export function productToForm(p: Product): ProductForm {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    inStock: p.inStock,
    shortDescription: p.shortDescription,
    description: p.description,
    details: p.details.join('\n'),
    tags: p.tags.join(', '),
    regularPrice: String(p.regularPrice),
    salePrice: p.salePrice !== undefined ? String(p.salePrice) : '',
    colors: distinct(p.variants.map((v) => v.color)).join(', '),
    sizes: distinct(p.variants.map((v) => v.size)).join(', '),
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku ?? '',
      color: v.color,
      size: v.size,
      regularPrice: String(v.regularPrice),
      salePrice: v.salePrice !== undefined ? String(v.salePrice) : '',
      stockQty: String(v.stockQty),
      imageUrl: v.imageUrl ?? '',
      active: v.active,
    })),
    images: [...p.images],
    attributes: p.attributes.map((a) => ({ ...a })),
    metaTitle: p.metaTitle ?? '',
    metaDescription: p.metaDescription ?? '',
    metaKeywords: p.metaKeywords.join(', '),
    ogImage: p.ogImage ?? '',
  };
}

/** Field errors keyed by field (`name`, `regularPrice`, ...) or `variant-<row>`. Empty object = valid. */
export function validateForm(f: ProductForm): Record<string, string> {
  const e: Record<string, string> = {};

  const name = f.name.trim();
  if (name.length < 2 || name.length > 120) e.name = 'Enter a product name (2 to 120 characters).';
  if (!SLUG_RE.test(f.slug)) e.slug = 'Use lowercase letters, numbers and single hyphens only.';

  const regular = toInt(f.regularPrice);
  if (regular === null || regular <= 0) e.regularPrice = 'Enter a whole-number regular price above 0.';
  if (f.salePrice.trim() !== '') {
    const sale = toInt(f.salePrice);
    if (sale === null || sale <= 0) e.salePrice = 'Enter a whole-number sale price above 0, or leave it empty.';
    else if (regular !== null && sale >= regular) e.salePrice = 'The sale price must be lower than the regular price.';
  }

  if (f.variants.length === 0) e.variants = 'Add at least one variant.';
  const combos = new Set<string>();
  const skus = new Set<string>();
  f.variants.forEach((v, i) => {
    const key = `variant-${i}`;
    const vr = toInt(v.regularPrice);
    const vs = v.salePrice.trim() === '' ? null : toInt(v.salePrice);
    const stock = toInt(v.stockQty);
    const combo = `${v.color.toLowerCase()}|${v.size.toLowerCase()}`;
    const sku = v.sku.trim().toLowerCase();

    if (vr === null || vr <= 0) e[key] = 'Enter a regular price above 0.';
    else if (v.salePrice.trim() !== '' && (vs === null || vs <= 0 || vs >= vr)) {
      e[key] = 'The sale price must be a whole number below the regular price.';
    } else if (stock === null) e[key] = 'Stock must be a whole number, 0 or more.';
    else if (combos.has(combo)) e[key] = 'This colour and size combination is already listed.';
    else if (sku !== '' && skus.has(sku)) e[key] = 'This SKU is already used by another variant.';

    combos.add(combo);
    if (sku !== '') skus.add(sku);
  });

  if (f.images.length > MAX_IMAGES) e.images = `Use at most ${MAX_IMAGES} images.`;
  if (f.attributes.some((a) => (a.name.trim() === '') !== (a.value.trim() === ''))) {
    e.attributes = 'Fill in both the name and the value of each attribute, or remove the row.';
  }
  if (f.metaTitle.length > META_TITLE_MAX) e.metaTitle = `Keep the meta title under ${META_TITLE_MAX} characters.`;
  if (f.metaDescription.length > META_DESCRIPTION_MAX) {
    e.metaDescription = `Keep the meta description under ${META_DESCRIPTION_MAX} characters.`;
  }
  return e;
}

/** Form -> Product. Run validateForm first. New variants get id ''. rating/updatedAt are not editable here. */
export function formToProduct(f: ProductForm): Product {
  const regularPrice = Number(f.regularPrice);
  const salePrice = f.salePrice.trim() !== '' ? Number(f.salePrice) : undefined;
  const variants: ProductVariant[] = f.variants.map((v, position) => ({
    id: v.id ?? '',
    sku: v.sku.trim() || null,
    color: v.color,
    size: v.size,
    regularPrice: Number(v.regularPrice),
    salePrice: v.salePrice.trim() !== '' ? Number(v.salePrice) : undefined,
    stockQty: Number(v.stockQty),
    imageUrl: v.imageUrl || undefined,
    position,
    active: v.active,
  }));
  const sizes = distinct(variants.map((v) => v.size));

  return {
    id: f.id ?? '',
    slug: f.slug,
    name: f.name.trim(),
    category: f.category,
    price: salePrice ?? regularPrice,
    regularPrice,
    salePrice,
    compareAtPrice: salePrice !== undefined ? regularPrice : undefined,
    shortDescription: f.shortDescription.trim(),
    description: f.description.trim(),
    details: splitLines(f.details),
    attributes: f.attributes
      .filter((a) => a.name.trim() !== '' && a.value.trim() !== '')
      .map((a) => ({ name: a.name.trim(), value: a.value.trim() })),
    tags: splitList(f.tags),
    images: f.images,
    colors: distinct(variants.map((v) => v.color)),
    sizes: sizes.length > 0 ? sizes : undefined,
    variants,
    metaTitle: f.metaTitle.trim() || undefined,
    metaDescription: f.metaDescription.trim() || undefined,
    metaKeywords: splitList(f.metaKeywords),
    ogImage: f.ogImage || undefined,
    isNew: f.isNew,
    isBestSeller: f.isBestSeller,
    inStock: f.inStock,
    ratingAvg: 0,
    ratingCount: 0,
  };
}

/** Arguments for the save_product RPC. undefined ids are dropped by JSON, so new rows get ids from the database. */
export function productToSaveArgs(p: Product): { p_product: Record<string, unknown>; p_variants: Record<string, unknown>[] } {
  return {
    p_product: {
      id: p.id || undefined,
      slug: p.slug,
      name: p.name,
      category: p.category,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice ?? null,
      shortDescription: p.shortDescription,
      description: p.description,
      details: p.details,
      tags: p.tags,
      attributes: p.attributes,
      metaTitle: p.metaTitle ?? null,
      metaDescription: p.metaDescription ?? null,
      metaKeywords: p.metaKeywords,
      ogImage: p.ogImage ?? null,
      images: p.images,
      isNew: p.isNew,
      isBestSeller: p.isBestSeller,
      inStock: p.inStock,
    },
    p_variants: p.variants.map((v) => ({
      id: v.id || undefined,
      sku: v.sku,
      color: v.color,
      size: v.size,
      regularPrice: v.regularPrice,
      salePrice: v.salePrice ?? null,
      stockQty: v.stockQty,
      imageUrl: v.imageUrl ?? null,
      position: v.position,
      active: v.active,
    })),
  };
}
