import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrackingUrl } from './tracking';

test('buildTrackingUrl fills the {tracking} placeholder and encodes the number', () => {
  assert.equal(
    buildTrackingUrl('https://courier.example/track?cn={tracking}', 'AB 123/9'),
    'https://courier.example/track?cn=AB%20123%2F9'
  );
});

test('buildTrackingUrl replaces every placeholder', () => {
  assert.equal(
    buildTrackingUrl('https://c.example/{tracking}?ref={tracking}', '77'),
    'https://c.example/77?ref=77'
  );
});

test('buildTrackingUrl keeps a template without a placeholder as the link', () => {
  assert.equal(buildTrackingUrl('https://c.example/track', '77'), 'https://c.example/track');
});

test('buildTrackingUrl returns null for an empty template or tracking number', () => {
  assert.equal(buildTrackingUrl('', '77'), null);
  assert.equal(buildTrackingUrl('   ', '77'), null);
  assert.equal(buildTrackingUrl('https://c.example/{tracking}', '  '), null);
});

test('buildTrackingUrl refuses links that are not http or https', () => {
  assert.equal(buildTrackingUrl('javascript:alert({tracking})', '1'), null);
  assert.equal(buildTrackingUrl('//c.example/{tracking}', '1'), null);
});
