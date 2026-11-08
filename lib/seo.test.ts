import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProductJsonLd, jsonLdScript } from './seo';
import type { Product, ProductVariant, Review } from '../types/product';

const variant = (id: string, price: number, stockQty = 5): ProductVariant => ({
  id,
  sku: `SKU-${id}`,
  color: id,
  size: '',
  regularPrice: price,
  stockQty,
  position: 0,
  active: true,
});

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  slug: 'p-one',
  name: 'Piece One',
  category: 'rings',
  price: 1000,
  regularPrice: 1000,
  shortDescription: 'Short',
  description: 'Long description',
  details: [],
  attributes: [],
  tags: [],
  images: ['https://example.com/a.jpg'],
  colors: [],
  variants: [variant('a', 1000)],
  metaKeywords: [],
  isNew: false,
  isBestSeller: false,
  inStock: true,
  ratingAvg: 0,
  ratingCount: 0,
  ...overrides,
});

const review: Review = {
  id: 'r1',
  productId: 'p1',
  rating: 5,
  authorName: 'Ayesha',
  title: '',
  body: 'Lovely piece, arrived quickly.',
  status: 'approved',
  isVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
};

test('no aggregateRating or review when there are no ratings', () => {
  const ld = buildProductJsonLd(product(), [], 'https://x.pk') as Record<string, unknown>;
  assert.equal(ld.aggregateRating, undefined);
  assert.equal(ld.review, undefined);
});

test('aggregateRating and reviews appear once ratings exist', () => {
  const ld = buildProductJsonLd(product({ ratingAvg: 4.5, ratingCount: 2 }), [review], 'https://x.pk') as Record<string, any>;
  assert.equal(ld.aggregateRating.ratingValue, 4.5);
  assert.equal(ld.aggregateRating.reviewCount, 2);
  assert.equal(ld.review[0].author.name, 'Ayesha');
});

test('same variant prices give an Offer, different prices an AggregateOffer', () => {
  const single = buildProductJsonLd(product(), [], 'https://x.pk') as Record<string, any>;
  assert.equal(single.offers['@type'], 'Offer');
  const range = buildProductJsonLd(
    product({ variants: [variant('a', 1000), variant('b', 1500)] }),
    [],
    'https://x.pk'
  ) as Record<string, any>;
  assert.equal(range.offers['@type'], 'AggregateOffer');
  assert.equal(range.offers.lowPrice, 1000);
  assert.equal(range.offers.highPrice, 1500);
});

test('sold out and no stale priceValidUntil', () => {
  const ld = buildProductJsonLd(product({ variants: [variant('a', 1000, 0)] }), [], 'https://x.pk') as Record<string, any>;
  assert.equal(ld.offers.availability, 'https://schema.org/OutOfStock');
  assert.ok(!('priceValidUntil' in ld.offers));
});

test('jsonLdScript escapes < so text cannot close the script tag', () => {
  const out = jsonLdScript({ name: '</script><script>alert(1)</script>' });
  assert.ok(!out.includes('<'));
  assert.deepEqual(JSON.parse(out), { name: '</script><script>alert(1)</script>' });
});
