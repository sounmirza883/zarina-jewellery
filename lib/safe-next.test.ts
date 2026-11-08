import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNext } from './safe-next';

test('safeNext keeps same-site paths', () => {
  assert.equal(safeNext('/account/orders'), '/account/orders');
  assert.equal(safeNext('/checkout?x=1'), '/checkout?x=1');
});

test('safeNext rejects anything that could leave the site', () => {
  for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'evil.com', '/\t/evil.com', '/a\nb', '', null, undefined]) {
    assert.equal(safeNext(bad), '/account');
  }
});

test('safeNext uses the given fallback', () => {
  assert.equal(safeNext('//x', '/'), '/');
});
