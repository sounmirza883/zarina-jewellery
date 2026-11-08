import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_COUPON,
  couponStatus,
  couponToInput,
  describeOffer,
  normalizeCode,
  toCouponRow,
  toLocalInput,
  validateCouponForm,
  type CouponInput,
} from './coupon-form';
import type { Coupon } from '@/types/product';

const valid: CouponInput = { ...EMPTY_COUPON, code: 'save10', kind: 'percent', value: '10' };

const coupon = (o: Partial<Coupon> = {}): Coupon => ({
  code: 'SAVE10',
  kind: 'percent',
  value: 10,
  categories: [],
  minSubtotal: 0,
  includeSaleItems: true,
  oncePerCustomer: false,
  active: true,
  createdAt: '2026-11-01T00:00:00Z',
  ...o,
});

test('normalizeCode trims and upper-cases', () => {
  assert.equal(normalizeCode('  save10 '), 'SAVE10');
});

test('validateCouponForm accepts a complete coupon and a free-delivery one without a value', () => {
  assert.deepEqual(validateCouponForm(valid), {});
  assert.deepEqual(validateCouponForm({ ...EMPTY_COUPON, code: 'FREESHIP', kind: 'free_shipping' }), {});
});

test('validateCouponForm checks the code format', () => {
  for (const code of ['', 'ab', 'x'.repeat(21), 'save 10', 'save!']) {
    assert.ok(validateCouponForm({ ...valid, code }).code, `code "${code}"`);
  }
  assert.equal(validateCouponForm({ ...valid, code: 'new_year-24' }).code, undefined);
});

test('validateCouponForm checks the value for each kind', () => {
  for (const value of ['', '0', '101', '10.5', 'abc']) {
    assert.ok(validateCouponForm({ ...valid, value }).value, `percent "${value}"`);
  }
  assert.equal(validateCouponForm({ ...valid, value: '100' }).value, undefined);
  assert.ok(validateCouponForm({ ...valid, kind: 'fixed', value: '0' }).value);
  assert.equal(validateCouponForm({ ...valid, kind: 'fixed', value: '500' }).value, undefined);
});

test('validateCouponForm checks the optional limits', () => {
  assert.ok(validateCouponForm({ ...valid, minSubtotal: '-5' }).minSubtotal);
  assert.equal(validateCouponForm({ ...valid, minSubtotal: '3000' }).minSubtotal, undefined);
  assert.ok(validateCouponForm({ ...valid, usageLimit: '0' }).usageLimit);
  assert.ok(validateCouponForm({ ...valid, usageLimit: '1.5' }).usageLimit);
  assert.equal(validateCouponForm({ ...valid, usageLimit: '100' }).usageLimit, undefined);
});

test('validateCouponForm needs the expiry to be after the start', () => {
  const dates = { startsAt: '2026-11-10T09:00', expiresAt: '2026-11-20T09:00' };
  assert.equal(validateCouponForm({ ...valid, ...dates }).dates, undefined);
  assert.ok(validateCouponForm({ ...valid, startsAt: dates.expiresAt, expiresAt: dates.startsAt }).dates);
  assert.ok(validateCouponForm({ ...valid, startsAt: dates.startsAt, expiresAt: dates.startsAt }).dates);
  assert.equal(validateCouponForm({ ...valid, expiresAt: dates.expiresAt }).dates, undefined);
});

test('toCouponRow builds the database row', () => {
  const row = toCouponRow({
    ...valid,
    categories: ['rings'],
    minSubtotal: '2000',
    usageLimit: '50',
    oncePerCustomer: true,
    includeSaleItems: false,
    expiresAt: '2026-11-20T09:00',
  });
  assert.equal(row.code, 'SAVE10');
  assert.equal(row.value, 10);
  assert.deepEqual(row.categories, ['rings']);
  assert.equal(row.min_subtotal, 2000);
  assert.equal(row.usage_limit, 50);
  assert.equal(row.once_per_customer, true);
  assert.equal(row.include_sale_items, false);
  assert.equal(row.starts_at, null);
  assert.equal(new Date(row.expires_at as string).getTime(), new Date('2026-11-20T09:00').getTime());
});

test('toCouponRow forces a free-delivery coupon to value 0 and blank limits to defaults', () => {
  const row = toCouponRow({ ...EMPTY_COUPON, code: 'ship', kind: 'free_shipping', value: '99' });
  assert.equal(row.value, 0);
  assert.equal(row.min_subtotal, 0);
  assert.equal(row.usage_limit, null);
});

test('couponToInput and toLocalInput round-trip a saved coupon', () => {
  const iso = new Date('2026-11-20T09:30').toISOString();
  assert.equal(toLocalInput(iso), '2026-11-20T09:30');
  assert.equal(toLocalInput(undefined), '');
  const input = couponToInput(coupon({ kind: 'fixed', value: 500, minSubtotal: 3000, expiresAt: iso, usageLimit: 20 }));
  assert.equal(input.value, '500');
  assert.equal(input.minSubtotal, '3000');
  assert.equal(input.expiresAt, '2026-11-20T09:30');
  assert.equal(input.usageLimit, '20');
  assert.equal(couponToInput(coupon({ kind: 'free_shipping', value: 0 })).value, '');
});

test('describeOffer reads naturally', () => {
  assert.equal(describeOffer({ kind: 'percent', value: 10, categories: [] }), '10% off everything');
  assert.equal(describeOffer({ kind: 'percent', value: 15, categories: ['rings'] }), '15% off rings');
  assert.equal(describeOffer({ kind: 'fixed', value: 500, categories: ['rings', 'necklaces'] }), 'Rs. 500 off rings & necklaces');
  assert.equal(
    describeOffer({ kind: 'percent', value: 5, categories: ['earrings', 'rings', 'bracelets'] }),
    '5% off earrings, rings & bracelets'
  );
  assert.equal(describeOffer({ kind: 'free_shipping', value: 0, categories: [] }), 'Free delivery');
  assert.equal(describeOffer({ kind: 'free_shipping', value: 0, categories: ['rings'] }), 'Free delivery with rings');
});

test('couponStatus orders disabled, expired, scheduled, used-up, active', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  assert.equal(couponStatus(coupon({ active: false }), 0, now), 'disabled');
  assert.equal(couponStatus(coupon({ expiresAt: '2026-11-09T00:00:00Z' }), 0, now), 'expired');
  assert.equal(couponStatus(coupon({ startsAt: '2026-11-11T00:00:00Z' }), 0, now), 'scheduled');
  assert.equal(couponStatus(coupon({ usageLimit: 5 }), 5, now), 'used-up');
  assert.equal(couponStatus(coupon({ usageLimit: 5 }), 4, now), 'active');
  assert.equal(couponStatus(coupon(), 999, now), 'active');
});
