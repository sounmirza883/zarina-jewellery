'use client';

import { useEffect, useId, useState } from 'react';
import { AlertCircle, ShieldCheck, Star } from 'lucide-react';
import StarRating from '@/components/StarRating';
import { createClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';
import { REVIEW_LIMITS, validateReview, type ReviewErrors } from '@/lib/review-form';
import type { Review } from '@/types/product';

interface ReviewsSectionProps {
  productId: string;
  productName: string;
  reviews: Review[];
  ratingAvg: number;
  ratingCount: number;
}

// UTC keeps the server-rendered and browser-rendered dates identical (no hydration mismatch).
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

const inputClass = (invalid: boolean) =>
  `w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden ${
    invalid ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
  }`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export default function ReviewsSection({
  productId,
  productName,
  reviews,
  ratingAvg,
  ratingCount,
}: ReviewsSectionProps) {
  const uid = useId();
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Signed-in customers get their name pre-filled; failures are ignored on purpose.
  useEffect(() => {
    let cancelled = false;
    import('@/lib/account')
      .then(async (account) => {
        if (!(await account.getCurrentUser())) return;
        const profile = await account.fetchMyProfile();
        if (!cancelled && profile?.fullName) setAuthor((current) => current || profile.fullName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const found = validateReview({ author, rating, title, body });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!supabaseConfigured) {
      setSubmitError('Reviews are not available right now.');
      return;
    }

    setBusy(true);
    try {
      const { error } = await createClient().rpc('submit_review', {
        p_product_id: productId,
        p_rating: rating,
        p_author: author.trim(),
        p_title: title.trim(),
        p_body: body.trim(),
        p_hp: hp,
      });
      if (error) {
        // P0001 messages are written for customers inside submit_review; anything else is a server fault.
        setSubmitError(
          error.code === 'P0001' ? error.message : 'We could not submit your review. Please try again.'
        );
        return;
      }
      setDone(true);
    } catch {
      setSubmitError('We could not submit your review. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reviews" aria-labelledby={`${uid}-heading`} className="mt-16 pt-10 border-t border-[#E8DDD0]">
      <h2 id={`${uid}-heading`} className="font-serif text-2xl sm:text-3xl text-[#0B0D12] font-normal">
        Customer Reviews
      </h2>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Summary */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#E8DDD0] p-6 self-start">
          {ratingCount > 0 ? (
            <>
              <div className="flex items-end gap-3">
                <span className="font-serif text-5xl text-[#0B0D12] leading-none">{ratingAvg.toFixed(1)}</span>
                <span className="text-xs text-[#575757] pb-1">out of 5</span>
              </div>
              <StarRating value={ratingAvg} size="md" className="mt-2" />
              <p className="mt-1 text-xs text-[#575757]">
                Based on {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
              </p>
              {reviews.length > 0 && (
                <ul className="mt-5 space-y-1.5" aria-label="Rating breakdown">
                  {distribution.map(({ star, count }) => (
                    <li key={star} className="flex items-center gap-2 text-[11px] text-[#575757]">
                      <span className="w-8 shrink-0">{star} star</span>
                      <span className="flex-1 h-1.5 rounded-full bg-[#F3ECE1] overflow-hidden">
                        <span
                          className="block h-full bg-[#B8893B]"
                          style={{ width: `${(count / reviews.length) * 100}%` }}
                        />
                      </span>
                      <span className="w-5 text-right">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-[#575757]">No reviews yet. Be the first to review {productName}.</p>
          )}
        </div>

        {/* List */}
        <div className="lg:col-span-8">
          {reviews.length === 0 ? (
            <p className="text-sm text-[#575757]">No reviews yet.</p>
          ) : (
            <ul className="divide-y divide-[#E8DDD0]">
              {reviews.map((review) => (
                <li key={review.id} className="py-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StarRating value={review.rating} />
                    {review.title && <h3 className="text-sm font-semibold text-[#1F1F1F]">{review.title}</h3>}
                  </div>
                  <p className="mt-2 text-sm text-[#1F1F1F] leading-relaxed whitespace-pre-line">{review.body}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#575757]">
                    <span className="font-medium text-[#1F1F1F]">{review.authorName}</span>
                    <span>{formatDate(review.createdAt)}</span>
                    {review.isVerified && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        Verified buyer
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="mt-10 bg-white rounded-xl border border-[#E8DDD0] p-6 sm:p-8 max-w-2xl">
        <h3 className="font-serif text-xl text-[#0B0D12] font-normal">Write a review</h3>

        {done ? (
          <p role="status" className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            Thank you! Your review will appear after approval.
          </p>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
            <fieldset>
              <legend className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Your rating <span className="text-[#991B1B]">*</span>
              </legend>
              <div className="flex gap-1 text-[#B8893B]">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`${uid}-rating`}
                      value={n}
                      checked={rating === n}
                      onChange={() => setRating(n)}
                      className="peer sr-only"
                    />
                    <Star
                      className="w-7 h-7 rounded peer-focus-visible:outline-2 peer-focus-visible:outline-[#B8893B]"
                      fill={n <= rating ? 'currentColor' : 'none'}
                      aria-hidden="true"
                    />
                    <span className="sr-only">
                      {n} {n === 1 ? 'star' : 'stars'}
                    </span>
                  </label>
                ))}
              </div>
              <FieldError message={errors.rating} />
            </fieldset>

            <div>
              <label htmlFor={`${uid}-author`} className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Your name <span className="text-[#991B1B]">*</span>
              </label>
              <input
                id={`${uid}-author`}
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={REVIEW_LIMITS.author.max}
                autoComplete="name"
                className={inputClass(!!errors.author)}
              />
              <FieldError message={errors.author} />
            </div>

            <div>
              <label htmlFor={`${uid}-title`} className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Title (optional)
              </label>
              <input
                id={`${uid}-title`}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={REVIEW_LIMITS.title.max}
                className={inputClass(!!errors.title)}
              />
              <FieldError message={errors.title} />
            </div>

            <div>
              <label htmlFor={`${uid}-body`} className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Your review <span className="text-[#991B1B]">*</span>
              </label>
              <textarea
                id={`${uid}-body`}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={REVIEW_LIMITS.body.max}
                className={inputClass(!!errors.body)}
              />
              <FieldError message={errors.body} />
            </div>

            {/* Honeypot: real visitors never see or fill this. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Leave this field empty
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
              </label>
            </div>

            {submitError && (
              <p role="alert" className="p-3 rounded-lg border border-[#991B1B]/30 bg-rose-50 text-xs text-[#991B1B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{submitError}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="px-6 py-3 bg-[#0B0D12] hover:bg-[#B8893B] disabled:bg-[#8A8A8A] text-white text-xs uppercase tracking-widest font-semibold rounded-md transition-colors cursor-pointer"
            >
              {busy ? 'Submitting...' : 'Submit review'}
            </button>
            <p className="text-[11px] text-[#8A8A8A]">Reviews are checked before they appear on the site.</p>
          </form>
        )}
      </div>
    </section>
  );
}
