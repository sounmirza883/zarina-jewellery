import test from 'node:test';
import assert from 'node:assert/strict';
import { rowToProduct, rowToOrder, type ProductRow, type OrderRow } from './mappers';

const productRow = (o: Partial<ProductRow> = {}): ProductRow => ({
  id: 'zj-1',
  slug: 'ring',
  name: 'Ring',
  category: 'rings',
  price: 1500,
  regular_price: 2000,
  sale_price: 1500,
  compare_at_price: 2000,
  short_description: 'Short.',
  description: 'Long.',
  details: [],
  attributes: [{ name: 'Material', value: 'Brass' }],
  tags: ['ring'],
  images: ['/a.jpg'],
  colors: ['Gold'],
  sizes: null,
  meta_title: null,
  meta_description: null,
  meta_keywords: [],
  og_image: null,
  is_new: false,
  is_best_seller: true,
  in_stock: true,
  rating_avg: '4.50',
  rating_count: 2,
  updated_at: null,
  ...o,
});

test('rowToProduct maps prices, optional fields and sorted variants', () => {
  const p = rowToProduct(
    productRow({
      product_variants: [
        { id: 'b', product_id: 'zj-1', sku: null, color: 'Silver', size: '', regular_price: 2000, sale_price: null, stock_qty: 0, image_url: '/b.jpg', position: 2, active: true },
        { id: 'a', product_id: 'zj-1', sku: 'S-1', color: 'Gold', size: '', regular_price: 2000, sale_price: 1500, stock_qty: 7, image_url: null, position: 1, active: true },
      ],
    })
  );
  assert.equal(p.price, 1500);
  assert.equal(p.regularPrice, 2000);
  assert.equal(p.salePrice, 1500);
  assert.equal(p.ratingAvg, 4.5);
  assert.equal(p.sizes, undefined);
  assert.equal(p.metaTitle, undefined);
  assert.deepEqual(p.variants.map((v) => v.id), ['a', 'b']);
  assert.equal(p.variants[0].salePrice, 1500);
  assert.equal(p.variants[1].salePrice, undefined);
  assert.equal(p.variants[1].imageUrl, '/b.jpg');
});

test('rowToProduct without embedded variants gives an empty variant list and falls back to price', () => {
  const p = rowToProduct(productRow({ regular_price: null, sale_price: null, compare_at_price: null }));
  assert.deepEqual(p.variants, []);
  assert.equal(p.regularPrice, 1500);
  assert.equal(p.salePrice, undefined);
});

test('rowToOrder maps the snake_case row to the app order', () => {
  const row: OrderRow = {
    order_number: 'ZJ-123456',
    items: [],
    subtotal: 2000,
    shipping: 250,
    total: 2250,
    customer: { fullName: 'Ayesha Khan', phone: '03001234567', province: 'Punjab', city: 'Lahore', address: 'House 1, Street 2' },
    status: 'Dispatched',
    created_at: '2026-11-01T10:00:00Z',
    user_id: null,
  };
  const o = rowToOrder(row);
  assert.equal(o.orderNumber, 'ZJ-123456');
  assert.equal(o.status, 'Dispatched');
  assert.equal(o.createdAt, '2026-11-01T10:00:00Z');
  assert.equal(o.paymentMethod, 'Cash on Delivery');
  assert.equal(o.userId, null);
});
