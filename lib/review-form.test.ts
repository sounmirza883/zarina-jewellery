import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReview } from './review-form';

const valid = { author: 'Ayesha Khan', rating: 5, title: 'Lovely', body: 'Beautiful finish and packaging.' };

test('validateReview accepts a complete review and an empty title', () => {
  assert.deepEqual(validateReview(valid), {});
  assert.deepEqual(validateReview({ ...valid, title: '' }), {});
});

test('validateReview rejects a short or oversized name', () => {
  assert.ok(validateReview({ ...valid, author: ' A ' }).author);
  assert.ok(validateReview({ ...valid, author: 'x'.repeat(61) }).author);
  assert.equal(validateReview({ ...valid, author: 'x'.repeat(60) }).author, undefined);
});

test('validateReview requires an integer rating from 1 to 5', () => {
  for (const rating of [0, 6, 3.5, NaN]) {
    assert.ok(validateReview({ ...valid, rating }).rating, `rating ${rating}`);
  }
  assert.equal(validateReview({ ...valid, rating: 1 }).rating, undefined);
});

test('validateReview limits title and body lengths after trimming', () => {
  assert.ok(validateReview({ ...valid, title: 'x'.repeat(101) }).title);
  assert.ok(validateReview({ ...valid, body: '   short   ' }).body);
  assert.ok(validateReview({ ...valid, body: 'x'.repeat(2001) }).body);
  assert.equal(validateReview({ ...valid, body: 'x'.repeat(2000) }).body, undefined);
});
