import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  size?: 'sm' | 'md';
  count?: number;
  className?: string;
}

/** Read-only star row (supports fractions). Server-safe: no hooks, no client code. */
export default function StarRating({ value, size = 'sm', count, className = '' }: StarRatingProps) {
  const clamped = Math.min(5, Math.max(0, value));
  const dim = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        role="img"
        aria-label={`${Number(clamped.toFixed(1))} out of 5`}
        className="inline-flex gap-0.5"
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.min(1, Math.max(0, clamped - i));
          return (
            <span key={i} className={`relative inline-block ${dim}`}>
              <Star className={`absolute inset-0 ${dim} text-[#D9C9A8]`} aria-hidden="true" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${dim} text-[#B8893B]`} fill="currentColor" aria-hidden="true" />
              </span>
            </span>
          );
        })}
      </span>
      {count !== undefined && <span className="text-[11px] text-[#575757]">({count})</span>}
    </span>
  );
}
