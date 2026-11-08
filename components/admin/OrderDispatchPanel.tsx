'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Truck } from 'lucide-react';
import OrderTimeline from '@/components/OrderTimeline';
import { fetchOrderEvents, updateOrderDispatch } from '@/lib/admin-orders';
import { buildTrackingUrl } from '@/lib/tracking';
import type { Courier, Order, OrderEvent } from '@/types/product';

const fieldClass =
  'w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]';

/**
 * Courier, tracking number and status history for one order (admin order modal).
 * Saved values go to the database and are reported to the parent through onUpdated.
 */
export default function OrderDispatchPanel({
  order,
  couriers,
  onUpdated,
}: {
  order: Order;
  couriers: Courier[];
  onUpdated: (patch: Partial<Order>) => void;
}) {
  const [courier, setCourier] = useState(order.courier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '');
  const [events, setEvents] = useState<OrderEvent[]>(order.events ?? []);
  const [seen, setSeen] = useState(order.orderNumber);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Another order was opened in the same modal: reset the form (render-phase reset, no effect needed).
  if (seen !== order.orderNumber) {
    setSeen(order.orderNumber);
    setCourier(order.courier ?? '');
    setTrackingNumber(order.trackingNumber ?? '');
    setEvents(order.events ?? []);
    setError('');
  }

  useEffect(() => {
    let live = true;
    fetchOrderEvents(order.orderNumber)
      .then((list) => live && setEvents(list))
      .catch(() => {}); // the timeline is secondary; the saved order data still shows
    return () => {
      live = false;
    };
  }, [order.orderNumber]);

  const save = async (markDispatched: boolean) => {
    setBusy(true);
    setError('');
    try {
      const patch = {
        courier: courier.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        ...(markDispatched ? { status: 'Dispatched' as const } : {}),
      };
      await updateOrderDispatch(order.orderNumber, patch);
      onUpdated(patch);
      setEvents(await fetchOrderEvents(order.orderNumber));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const selected = couriers.find((c) => c.name === courier);
  const link = selected && trackingNumber ? buildTrackingUrl(selected.trackingUrl, trackingNumber) : null;
  // A courier that is no longer in Settings must stay selectable so saving does not silently clear it.
  const options = courier && !selected ? [...couriers, { name: courier, trackingUrl: '' }] : couriers;

  return (
    <section className="no-print py-4 border-t border-[#FAF7F2] space-y-4" aria-label="Dispatch and tracking">
      <h4 className="font-semibold text-[#1F1F1F] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
        <Truck className="w-3.5 h-3.5 text-[#B8893B]" />
        <span>Dispatch &amp; Tracking</span>
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="dispatch-courier" className="block text-[11px] text-[#575757] mb-1">
            Courier
          </label>
          <select
            id="dispatch-courier"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className={fieldClass}
          >
            <option value="">Not assigned</option>
            {options.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dispatch-tracking" className="block text-[11px] text-[#575757] mb-1">
            Tracking number
          </label>
          <input
            id="dispatch-tracking"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            maxLength={80}
            placeholder="e.g. 7301234567"
            className={`${fieldClass} font-mono`}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-[#991B1B] bg-rose-50 border border-rose-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => save(false)}
          className="px-3 py-2 text-xs font-semibold rounded border border-[#B8893B] text-[#B8893B] hover:bg-[#FAF7F2] disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save tracking'}
        </button>
        {order.status !== 'Dispatched' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => save(true)}
            className="px-3 py-2 text-xs font-semibold rounded bg-[#0B0D12] text-white hover:bg-[#B8893B] disabled:opacity-60"
          >
            Save &amp; mark dispatched
          </button>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8893B] hover:text-[#0B0D12]"
          >
            <span>Open courier tracking</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div>
        <h5 className="text-[11px] text-[#575757] mb-2">Status history</h5>
        <OrderTimeline events={events} />
      </div>
    </section>
  );
}
