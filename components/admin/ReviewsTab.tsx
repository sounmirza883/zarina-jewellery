'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ShieldCheck, Trash2 } from 'lucide-react';
import StarRating from '@/components/StarRating';
import { approveReview, deleteReview, fetchReviews } from '@/lib/admin-reviews';
import type { Review } from '@/types/product';

type Filter = 'all' | 'pending' | 'approved';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'all', label: 'All' },
];

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

export default function ReviewsTab({ onChanged }: { onChanged?: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews()
      .then(setReviews)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      all: reviews.length,
      pending: reviews.filter((r) => r.status === 'pending').length,
      approved: reviews.filter((r) => r.status === 'approved').length,
    }),
    [reviews]
  );

  const visible = useMemo(
    () => (filter === 'all' ? reviews : reviews.filter((r) => r.status === filter)),
    [reviews, filter]
  );

  const run = async (id: string, action: () => Promise<void>, apply: (list: Review[]) => Review[]) => {
    setBusyId(id);
    try {
      await action();
      setReviews(apply);
      setError('');
      onChanged?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const approve = (review: Review) =>
    run(
      review.id,
      () => approveReview(review.id),
      (list) => list.map((r) => (r.id === review.id ? { ...r, status: 'approved' as const } : r))
    );

  const remove = (review: Review) => {
    if (!confirm(`Delete this review by ${review.authorName}? This cannot be undone.`)) return;
    return run(
      review.id,
      () => deleteReview(review.id),
      (list) => list.filter((r) => r.id !== review.id)
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="shrink-0 font-semibold hover:underline"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reviews by status">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              filter === value
                ? 'bg-[#0B0D12] text-white border-[#0B0D12]'
                : 'bg-white text-[#575757] border-[#E8DDD0] hover:border-[#B8893B]'
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#575757]">Loading reviews...</p>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8DDD0] p-10 text-center text-sm text-[#575757]">
          {filter === 'pending' ? 'No reviews are waiting for approval.' : 'No reviews to show.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((review) => (
            <li key={review.id} className="bg-white rounded-xl border border-[#B8893B]/20 shadow-xs p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-base text-[#0B0D12] truncate">
                    {review.productName ?? review.productId}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StarRating value={review.rating} />
                    {review.title && <span className="text-sm font-semibold text-[#1F1F1F]">{review.title}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {review.status === 'pending' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Approved
                    </span>
                  )}
                  {review.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                      Verified buyer
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm text-[#1F1F1F] leading-relaxed whitespace-pre-line">{review.body}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-[#575757]">
                  <span className="font-medium text-[#1F1F1F]">{review.authorName}</span>
                  {' · '}
                  {new Date(review.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <div className="flex items-center gap-2">
                  {review.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => approve(review)}
                      disabled={busyId === review.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Approve
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(review)}
                    disabled={busyId === review.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-60 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
