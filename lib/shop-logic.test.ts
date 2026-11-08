import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPKR,
  calculateCartTotals,
  isValidPakistaniPhone,
  normalizePakistaniPhone,
  getCartItemId,
} from './shop-logic';
import { Product, CartItem } from '../types/product';

const mockProductA: Product = {
  id: 'prod-1',
  slug: 'kundan-chandbali',
  name: 'Kundan Chandbali',
  category: 'earrings',
  price: 2000,
  images: ['/images/products/kundan.jpg'],
  colors: ['Gold-tone'],
  description: 'Elegant earrings',
  details: ['Gold-tone finish'],
  tags: ['traditional'],
  isNew: true,
  isBestSeller: true,
  inStock: true,
};

const mockProductB: Product = {
  id: 'prod-2',
  slug: 'solitaire-ring',
  name: 'Solitaire Ring',
  category: 'rings',
  price: 1800,
  images: ['/images/products/ring.jpg'],
  colors: ['Gold-tone'],
  sizes: ['7'],
  description: 'Sparkling ring',
  details: ['Zircon stones'],
  tags: ['minimal'],
  isNew: false,
  isBestSeller: true,
  inStock: true,
};

test('formatPKR formats amount properly', () => {
  assert.equal(formatPKR(2450), 'Rs. 2,450');
  assert.equal(formatPKR(0), 'Rs. 0');
  assert.equal(formatPKR(15000), 'Rs. 15,000');
});

test('calculateCartTotals calculates flat shipping below threshold', () => {
  const items: CartItem[] = [
    {
      cartItemId: 'item-1',
      product: mockProductA,
      quantity: 1, // 2000 PKR < 3500
      selectedColor: 'Gold-tone',
    },
  ];
  const totals = calculateCartTotals(items, 250, 3500);
  assert.equal(totals.subtotal, 2000);
  assert.equal(totals.shipping, 250);
  assert.equal(totals.total, 2250);
  assert.equal(totals.isFreeShipping, false);
  assert.equal(totals.freeShippingRemaining, 1500);
  assert.equal(totals.totalItemCount, 1);
});

test('calculateCartTotals applies free shipping above threshold', () => {
  const items: CartItem[] = [
    {
      cartItemId: 'item-1',
      product: mockProductA,
      quantity: 1, // 2000
      selectedColor: 'Gold-tone',
    },
    {
      cartItemId: 'item-2',
      product: mockProductB,
      quantity: 1, // 1800 => total 3800 > 3500
      selectedColor: 'Gold-tone',
      selectedSize: '7',
    },
  ];
  const totals = calculateCartTotals(items, 250, 3500);
  assert.equal(totals.subtotal, 3800);
  assert.equal(totals.shipping, 0);
  assert.equal(totals.total, 3800);
  assert.equal(totals.isFreeShipping, true);
  assert.equal(totals.freeShippingRemaining, 0);
  assert.equal(totals.totalItemCount, 2);
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

test('getCartItemId produces consistent identifier', () => {
  const id1 = getCartItemId('p1', 'Gold', '7');
  assert.equal(id1, 'p1__Gold__7');
  const id2 = getCartItemId('p1', 'Silver');
  assert.equal(id2, 'p1__Silver__default');
});
