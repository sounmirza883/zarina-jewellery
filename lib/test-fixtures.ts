import type { CartItem, Product, ProductVariant } from '../types/product';

// Small builders shared by the unit tests.

export const makeVariant = (o: Partial<ProductVariant> = {}): ProductVariant => ({
  id: 'v1',
  sku: 'SKU-1',
  color: '',
  size: '',
  regularPrice: 2000,
  stockQty: 10,
  position: 1,
  active: true,
  ...o,
});

export const makeProduct = (o: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  slug: 'kundan-chandbali',
  name: 'Kundan Chandbali',
  category: 'earrings',
  price: 2000,
  regularPrice: 2000,
  shortDescription: 'Elegant earrings.',
  description: 'Elegant earrings. Ideal for weddings.',
  details: [],
  attributes: [],
  tags: ['traditional'],
  images: ['/images/products/kundan.jpg'],
  colors: [],
  variants: [makeVariant()],
  metaKeywords: [],
  isNew: false,
  isBestSeller: false,
  inStock: true,
  ratingAvg: 0,
  ratingCount: 0,
  ...o,
});

export const makeItem = (o: Partial<CartItem> = {}): CartItem => ({
  cartItemId: 'v1',
  variantId: 'v1',
  product: makeProduct(),
  quantity: 1,
  selectedColor: '',
  ...o,
});
