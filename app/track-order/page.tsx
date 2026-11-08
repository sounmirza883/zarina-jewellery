'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ExternalLink, PackageSearch, Truck } from 'lucide-react';
import { fetchCourierLink, trackOrder } from '@/lib/tracking';
import { formatPKR, isValidPakistaniPhone } from '@/lib/shop-logic';
import type { TrackedOrder } from '@/types/product';
import OrderTimeline, { OrderStatusBadge } from '@/components/OrderTimeline';

const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden focus:border-[#B8893B]';

function TrackOrderContent() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get('order') ?? '');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [courierLink, setCourierLink] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setCourierLink(null);

    const number = orderNumber.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,20}$/.test(number)) {
      setError('Enter your order number, for example ZJ-123456.');
      return;
    }
    if (!isValidPakistaniPhone(phone)) {
      setError('Enter the mobile number you used when ordering, for example 0300 1234567.');
      return;
    }

    setBusy(true);
    try {
      const tracked = await trackOrder(number, phone);
      setResult(tracked);
      if (tracked.courier && tracked.trackingNumber) {
        setCourierLink(await fetchCourierLink(tracked.courier, tracked.trackingNumber).catch(() => null));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not look up your order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="py-10 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block mb-1">
            Order Tracking
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">Track Your Order</h1>
          <p className="mt-2 text-sm text-[#575757]">
            Enter your order number and the phone number you used at checkout.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="bg-white p-6 sm:p-8 rounded-xl border border-[#B8893B]/20 shadow-xs space-y-4"
        >
          <div>
            <label
              htmlFor="track-order-number"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5"
            >
              Order Number
            </label>
            <input
              id="track-order-number"
              type="text"
              autoComplete="off"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ZJ-123456"
              className={`${inputClass} font-mono uppercase`}
            />
          </div>

          <div>
            <label
              htmlFor="track-phone"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5"
            >
              Phone Number
            </label>
            <input
              id="track-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300 1234567"
              className={inputClass}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="p-3 rounded-lg border border-[#991B1B]/30 bg-rose-50 text-xs text-[#991B1B] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 bg-[#0B0D12] hover:bg-[#B8893B] disabled:bg-[#8A8A8A] text-white text-xs uppercase tracking-widest font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <PackageSearch className="w-4 h-4" />
            <span>{busy ? 'Looking up…' : 'Track Order'}</span>
          </button>
        </form>

        {result && (
          <section
            aria-live="polite"
            className="mt-8 bg-white p-6 sm:p-8 rounded-xl border border-[#E8DDD0] shadow-xs space-y-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#FAF7F2]">
              <div>
                <p className="text-xs text-[#575757]">Order</p>
                <p className="font-mono text-lg font-bold text-[#0B0D12]">{result.orderNumber}</p>
                <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                  Placed {new Date(result.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                  {result.city ? ` · ${result.city}` : ''}
                </p>
              </div>
              <OrderStatusBadge status={result.status} />
            </div>

            {result.courier && (
              <div className="p-4 bg-[#FAF7F2] rounded-lg border border-[#E8DDD0] flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-[#B8893B] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-[#1F1F1F]">{result.courier}</p>
                    {result.trackingNumber ? (
                      <p className="text-xs text-[#575757]">
                        Tracking number: <span className="font-mono">{result.trackingNumber}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-[#575757]">Tracking number will appear here soon.</p>
                    )}
                  </div>
                </div>
                {courierLink && (
                  <a
                    href={courierLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs font-semibold rounded transition-colors"
                  >
                    <span>Track with {result.courier}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            <div>
              <h2 className="font-semibold text-[#1F1F1F] uppercase tracking-wider text-[11px] mb-3">
                Progress
              </h2>
              <OrderTimeline events={result.events} />
            </div>

            <div>
              <h2 className="font-semibold text-[#1F1F1F] uppercase tracking-wider text-[11px] mb-2">
                Items
              </h2>
              <ul className="divide-y divide-[#FAF7F2] text-sm">
                {result.items.map((item, i) => (
                  <li key={`${item.name}-${i}`} className="py-2 flex justify-between gap-3">
                    <span className="text-[#1F1F1F]">
                      {item.name}
                      {item.variantLabel && item.variantLabel !== 'Default' && (
                        <span className="text-[#575757]"> ({item.variantLabel})</span>
                      )}
                    </span>
                    <span className="text-[#575757] shrink-0">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 pt-3 border-t border-[#E8DDD0] flex justify-between text-sm font-semibold text-[#1F1F1F]">
                <span>Total payable on delivery (COD)</span>
                <span className="text-[#B8893B]">{formatPKR(result.total)}</span>
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs uppercase tracking-wider text-[#575757]">Loading…</div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
