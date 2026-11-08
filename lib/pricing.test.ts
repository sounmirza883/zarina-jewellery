import test from 'node:test';
import assert from 'node:assert/strict';
import {
  variantPrice,
  variantOnSale,
  discountPercent,
  variantLabel,
  optionGroups,
  findVariant,
  isPurchasable,
  defaultVariant,
  priceRange,
  stockLabel,
  lineUnitPrice,
  totalStock,
} from './pricing';
import { makeItem, makeProduct, makeVariant } from './test-fixtures';

test('variantPrice uses the sale price when set', () => {
  assert.equal(variantPrice(makeVariant({ regularPrice: 2000 })), 2000);
  assert.equal(variantPrice(makeVariant({ regularPrice: 2000, salePrice: 1500 })), 1500);
  assert.equal(variantOnSale(makeVariant({ regularPrice: 2000, salePrice: 1500 })), true);
  assert.equal(variantOnSale(makeVariant({ regularPrice: 2000, salePrice: 2000 })), false);
});

test('discountPercent rounds and never goes negative', () => {
  assert.equal(discountPercent(2950, 2450), 17);
  assert.equal(discountPercent(2000, 2000), 0);
  assert.equal(discountPercent(1000, 1500), 0);
  assert.equal(discountPercent(0, 0), 0);
});

test('optionGroups lists distinct colours and sizes in display order, skipping inactive and empty', () => {
  const variants = [
    makeVariant({ id: 'a', color: 'Gold', size: '6', position: 1 }),
    makeVariant({ id: 'b', color: 'Gold', size: '7', position: 2 }),
    makeVariant({ id: 'c', color: 'Silver', size: '6', position: 3 }),
    makeVariant({ id: 'd', color: 'Rose', size: '8', position: 4, active: false }),
  ];
  assert.deepEqual(optionGroups(variants), { colors: ['Gold', 'Silver'], sizes: ['6', '7'] });
  assert.deepEqual(optionGroups([makeVariant()]), { colors: [], sizes: [] });
});

test('findVariant matches exact colour and size among active variants', () => {
  const variants = [
    makeVariant({ id: 'a', color: 'Gold', size: '6' }),
    makeVariant({ id: 'b', color: 'Gold', size: '7', active: false }),
  ];
  assert.equal(findVariant(variants, 'Gold', '6')?.id, 'a');
  assert.equal(findVariant(variants, 'Gold', '7'), undefined);
  assert.equal(findVariant(variants, 'Silver', '6'), undefined);
});

test('isPurchasable needs a listed product with stock on an active variant', () => {
  assert.equal(isPurchasable(makeProduct()), true);
  assert.equal(isPurchasable(makeProduct({ inStock: false })), false);
  assert.equal(isPurchasable(makeProduct({ variants: [makeVariant({ stockQty: 0 })] })), false);
  assert.equal(isPurchasable(makeProduct({ variants: [makeVariant({ stockQty: 4, active: false })] })), false);
  assert.equal(totalStock(makeProduct({ variants: [makeVariant({ stockQty: 4 }), makeVariant({ id: 'x', color: 'a', stockQty: 6 })] })), 10);
});

test('defaultVariant prefers an in-stock variant, then any active one', () => {
  const sold = makeVariant({ id: 'a', position: 1, stockQty: 0 });
  const ok = makeVariant({ id: 'b', color: 'Silver', position: 2, stockQty: 5 });
  assert.equal(defaultVariant(makeProduct({ variants: [sold, ok] }))?.id, 'b');
  assert.equal(defaultVariant(makeProduct({ variants: [sold] }))?.id, 'a');
  assert.equal(defaultVariant(makeProduct({ variants: [] })), undefined);
});

test('priceRange spans active variant prices and falls back to the product price', () => {
  const p = makeProduct({
    price: 1000,
    variants: [
      makeVariant({ id: 'a', regularPrice: 2000, salePrice: 1500 }),
      makeVariant({ id: 'b', color: 'x', regularPrice: 1800, position: 2 }),
    ],
  });
  assert.deepEqual(priceRange(p), { min: 1500, max: 1800, hasRange: true });
  assert.deepEqual(priceRange(makeProduct({ price: 900, variants: [] })), { min: 900, max: 900, hasRange: false });
});

test('stockLabel and variantLabel read well', () => {
  assert.equal(stockLabel({ stockQty: 0 }), 'Out of stock');
  assert.equal(stockLabel({ stockQty: 3 }), 'Only 3 left');
  assert.equal(stockLabel({ stockQty: 30 }), 'In stock');
  assert.equal(variantLabel({ color: 'Gold', size: '7' }), 'Gold / 7');
  assert.equal(variantLabel({ color: '', size: '' }), 'Default');
});

test('lineUnitPrice uses the stored unit price, else the product price', () => {
  assert.equal(lineUnitPrice(makeItem({ unitPrice: 1200 })), 1200);
  assert.equal(lineUnitPrice(makeItem({ product: makeProduct({ price: 777 }) })), 777);
});
