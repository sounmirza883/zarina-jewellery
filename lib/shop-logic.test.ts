import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPKR,
  calculateCartTotals,
  isValidPakistaniPhone,
  normalizePakistaniPhone,
  maxQuantity,
  cartItemLabel,
  MAX_PER_ITEM,
} from './shop-logic';
import { makeItem, makeProduct, makeVariant } from './test-fixtures';

test('formatPKR formats amount properly', () => {
  assert.equal(formatPKR(2450), 'Rs. 2,450');
  assert.equal(formatPKR(0), 'Rs. 0');
  assert.equal(formatPKR(15000), 'Rs. 15,000');
});

test('calculateCartTotals calculates flat shipping below threshold', () => {
  const items = [makeItem({ unitPrice: 2000, quantity: 1 })]; // 2000 PKR < 3500
  const totals = calculateCartTotals(items, 250, 3500);
  assert.equal(totals.subtotal, 2000);
  assert.equal(totals.shipping, 250);
  assert.equal(totals.total, 2250);
  assert.equal(totals.isFreeShipping, false);
  assert.equal(totals.freeShippingRemaining, 1500);
  assert.equal(totals.totalItemCount, 1);
});

test('calculateCartTotals applies free shipping above threshold', () => {
  const items = [
    makeItem({ cartItemId: 'a', variantId: 'a', unitPrice: 2000, quantity: 1 }),
    makeItem({ cartItemId: 'b', variantId: 'b', unitPrice: 1800, quantity: 1 }), // 3800 > 3500
  ];
  const totals = calculateCartTotals(items, 250, 3500);
  assert.equal(totals.subtotal, 3800);
  assert.equal(totals.shipping, 0);
  assert.equal(totals.total, 3800);
  assert.equal(totals.isFreeShipping, true);
  assert.equal(totals.freeShippingRemaining, 0);
  assert.equal(totals.totalItemCount, 2);
});

test('calculateCartTotals prices a line by its variant price, falling back to the product price', () => {
  const onSale = makeItem({ unitPrice: 1500, quantity: 2, product: makeProduct({ price: 2000 }) });
  const legacy = makeItem({ cartItemId: 'old', quantity: 1, product: makeProduct({ price: 900 }) });
  assert.equal(calculateCartTotals([onSale, legacy], 250, 3500).subtotal, 3900);
});

test('isValidPakistaniPhone validates standard Pakistani phone numbers correctly', () => {
  assert.equal(isValidPakistaniPhone('03001234567'), true);
  assert.equal(isValidPakistaniPhone('0300-1234567'), true);
  assert.equal(isValidPakistaniPhone('0300 1234567'), true);
  assert.equal(isValidPakistaniPhone('+923001234567'), true);
  assert.equal(isValidPakistaniPhone('923219876543'), true);
  assert.equal(isValidPakistaniPhone('00923335555555'), true);

  // Invalid numbers
  assert.equal(isValidPakistaniPhone('12345'), false);
  assert.equal(isValidPakistaniPhone('02131234567'), false); // Landline not mobile
  assert.equal(isValidPakistaniPhone('030012345'), false); // Too short
  assert.equal(isValidPakistaniPhone('abcdefghijk'), false);
});

test('normalizePakistaniPhone normalizes phone numbers to 03XXXXXXXXX format', () => {
  assert.equal(normalizePakistaniPhone('+923001234567'), '03001234567');
  assert.equal(normalizePakistaniPhone('0300-1234567'), '03001234567');
  assert.equal(normalizePakistaniPhone('923219876543'), '03219876543');
});

test('maxQuantity caps a bag line at the variant stock and at the per-order limit', () => {
  const low = makeItem({ variantId: 'v1', product: makeProduct({ variants: [makeVariant({ id: 'v1', stockQty: 3 })] }) });
  const plenty = makeItem({ variantId: 'v1', product: makeProduct({ variants: [makeVariant({ id: 'v1', stockQty: 500 })] }) });
  const unknown = makeItem({ variantId: 'gone' });
  assert.equal(maxQuantity(low), 3);
  assert.equal(maxQuantity(plenty), MAX_PER_ITEM);
  assert.equal(maxQuantity(unknown), MAX_PER_ITEM);
});

test('cartItemLabel prefers the variant label and falls back for older snapshots', () => {
  assert.equal(cartItemLabel({ variantLabel: 'Gold-tone / 7', selectedColor: 'x' }), 'Gold-tone / 7');
  assert.equal(cartItemLabel({ selectedColor: 'Gold-tone', selectedSize: '7' }), 'Gold-tone / 7');
  assert.equal(cartItemLabel({ selectedColor: '' }), 'Default');
});
