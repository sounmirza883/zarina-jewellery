import test from 'node:test';
import assert from 'node:assert/strict';
import { useWishlistStore } from '../store/wishlist';
import { useCartStore } from '../store/cart';

// No Supabase settings exist in the test environment, so every write to an account fails: that is exactly
// the "could not save" path the store must undo.

const reset = () => {
  useWishlistStore.setState({ ids: [], owner: null });
  useCartStore.setState({ toastMessage: null });
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('a guest can save and remove, with a toast each time', () => {
  reset();
  useWishlistStore.getState().toggle('zj-ring-01');
  assert.deepEqual(useWishlistStore.getState().ids, ['zj-ring-01']);
  assert.equal(useCartStore.getState().toastMessage, 'Saved to your wishlist');
  useWishlistStore.getState().toggle('zj-ring-01');
  assert.deepEqual(useWishlistStore.getState().ids, []);
  assert.equal(useCartStore.getState().toastMessage, 'Removed from your wishlist');
});

test('an invalid id changes nothing', () => {
  reset();
  useWishlistStore.getState().toggle('not valid!');
  assert.deepEqual(useWishlistStore.getState().ids, []);
  assert.equal(useCartStore.getState().toastMessage, null);
});

test('adopt sets the owner and keeps only valid, distinct ids', () => {
  reset();
  useWishlistStore.getState().adopt('user-1', ['a', 'b', 'a', 'bad id']);
  assert.equal(useWishlistStore.getState().owner, 'user-1');
  assert.deepEqual(useWishlistStore.getState().ids, ['a', 'b']);
});

test('releaseOwner clears an account list but leaves a guest list alone', () => {
  reset();
  useWishlistStore.setState({ ids: ['a'], owner: null });
  useWishlistStore.getState().releaseOwner();
  assert.deepEqual(useWishlistStore.getState().ids, ['a']);

  useWishlistStore.getState().adopt('user-1', ['a', 'b']);
  useWishlistStore.getState().releaseOwner();
  assert.deepEqual(useWishlistStore.getState().ids, []);
  assert.equal(useWishlistStore.getState().owner, null);
});

test('a signed-in save that cannot reach the account is undone with a message', async () => {
  reset();
  useWishlistStore.getState().adopt('user-1', ['a']);
  useWishlistStore.getState().toggle('b');
  assert.deepEqual(useWishlistStore.getState().ids, ['a', 'b']); // optimistic
  await tick();
  assert.deepEqual(useWishlistStore.getState().ids, ['a']); // undone
  assert.equal(useCartStore.getState().toastMessage, 'Could not update your wishlist. Please try again.');
});

test('a failed remove is put back, and a change of owner in between is not touched', async () => {
  reset();
  useWishlistStore.getState().adopt('user-1', ['a', 'b']);
  useWishlistStore.getState().toggle('b');
  assert.deepEqual(useWishlistStore.getState().ids, ['a']);
  await tick();
  assert.deepEqual(useWishlistStore.getState().ids, ['a', 'b']);

  reset();
  useWishlistStore.getState().adopt('user-1', ['a']);
  useWishlistStore.getState().toggle('c');
  useWishlistStore.getState().adopt('user-2', ['z']); // someone else signed in before the answer came back
  await tick();
  assert.deepEqual(useWishlistStore.getState().ids, ['z']);
});
