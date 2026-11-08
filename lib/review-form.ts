// Mirrors the limits enforced by submit_review() and the reviews table in supabase/schema.sql.
export const REVIEW_LIMITS = {
  author: { min: 2, max: 60 },
  title: { max: 100 },
  body: { min: 10, max: 2000 },
} as const;

export interface ReviewInput {
  author: string;
  rating: number;
  title: string;
  body: string;
}

export type ReviewErrors = Partial<Record<keyof ReviewInput, string>>;

/** Returns one message per invalid field; an empty object means the review can be sent. */
export function validateReview(input: ReviewInput): ReviewErrors {
  const errors: ReviewErrors = {};
  const author = input.author.trim();
  const title = input.title.trim();
  const body = input.body.trim();

  if (author.length < REVIEW_LIMITS.author.min || author.length > REVIEW_LIMITS.author.max) {
    errors.author = `Please enter your name (${REVIEW_LIMITS.author.min}-${REVIEW_LIMITS.author.max} characters).`;
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.rating = 'Please choose a rating from 1 to 5 stars.';
  }
  if (title.length > REVIEW_LIMITS.title.max) {
    errors.title = `The title can be at most ${REVIEW_LIMITS.title.max} characters.`;
  }
  if (body.length < REVIEW_LIMITS.body.min || body.length > REVIEW_LIMITS.body.max) {
    errors.body = `Please write ${REVIEW_LIMITS.body.min}-${REVIEW_LIMITS.body.max} characters about the product.`;
  }
  return errors;
}
