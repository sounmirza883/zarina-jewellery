import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_WISHLIST, isValidId, mergeIds, normalizeIds, toggleId } from './wishlist';

test('isValidId accepts product ids and rejects anything else', () => {
  assert.equal(isValidId('zj-ring-01'), true);
  assert.equal(isValidId('abc_DEF-123'), true);
  for (const bad of ['', ' ', 'a b', 'x'.repeat(81), "zj'; drop table", '<script>', 42, null, undefined, {}]) {
    assert.equal(isValidId(bad), false, String(bad));
  }
});

test('normalizeIds keeps valid ids once, in order, and survives garbage', () => {
  assert.deepEqual(normalizeIds(['a', 'b', 'a', 'c', 'b']), ['a', 'b', 'c']);
  assert.deepEqual(normalizeIds(['a', 'bad id', 7, null, 'b']), ['a', 'b']);
  assert.deepEqual(normalizeIds('not a list'), []);
  assert.deepEqual(normalizeIds(undefined), []);
});

test('normalizeIds caps the list', () => {
  const many = Array.from({ length: MAX_WISHLIST + 50 }, (_, i) => `p${i}`);
  assert.equal(normalizeIds(many).length, MAX_WISHLIST);
});

test('toggleId adds at the end and removes when already saved', () => {
  assert.deepEqual(toggleId(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(toggleId(['a', 'b'], 'a'), ['b']);
  assert.deepEqual(toggleId([], 'a'), ['a']);
});

test('toggleId ignores invalid ids and a full list', () => {
  assert.deepEqual(toggleId(['a'], 'bad id'), ['a']);
  const full = Array.from({ length: MAX_WISHLIST }, (_, i) => `p${i}`);
  assert.deepEqual(toggleId(full, 'new'), full);
  assert.equal(toggleId(full, 'p0').length, MAX_WISHLIST - 1);
});

test('mergeIds is the union with the account list first and no repeats', () => {
  assert.deepEqual(mergeIds(['a', 'b'], ['b', 'c']), ['a', 'b', 'c']);
  assert.deepEqual(mergeIds([], ['x', 'y']), ['x', 'y']);
  assert.deepEqual(mergeIds(['x'], []), ['x']);
  assert.deepEqual(mergeIds(null, undefined), []);
});
