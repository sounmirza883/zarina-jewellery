import type { CartItem, ContactMessage, Product, ProductVariant } from '../types/product';

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

export const makeContactMessage = (o: Partial<ContactMessage> = {}): ContactMessage => ({
  id: '6f1c2b9e-0d4a-4c3e-9a51-2b7d8e4f1a20',
  fullName: 'Fatima Ali',
  phone: '03001234567',
  email: 'fatima@example.com',
  subject: 'Noor Bridal Set delivery',
  message: 'Assalam o Alaikum, can the Noor Bridal Set reach Multan by Friday?\nThank you.',
  status: 'new',
  createdAt: '2026-11-12T09:30:00Z',
  ...o,
});
