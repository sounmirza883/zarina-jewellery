import test from 'node:test';
import assert from 'node:assert/strict';
import { useCartStore } from '../store/cart';
import { makeProduct, makeVariant } from './test-fixtures';

const reset = () => useCartStore.setState({ items: [], isDrawerOpen: false, toastMessage: null });

test('adding to the bag opens the bag drawer', () => {
  reset();
  useCartStore.getState().addItem(makeProduct(), makeVariant(), 1);
  assert.equal(useCartStore.getState().isDrawerOpen, true);
  assert.equal(useCartStore.getState().items.length, 1);
});

test('Buy Now adds the item but leaves the bag drawer closed', () => {
  reset();
  useCartStore.getState().addItem(makeProduct(), makeVariant(), 1, { openDrawer: false });
  assert.equal(useCartStore.getState().isDrawerOpen, false);
  assert.equal(useCartStore.getState().items.length, 1);
});
