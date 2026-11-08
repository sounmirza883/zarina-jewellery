import type { OrderEvent, OrderStatus } from '@/types/product';

const STATUS_LABEL: Record<OrderStatus, string> = {
  'Pending Phone Confirmation': 'Order placed, awaiting confirmation call',
  Confirmed: 'Order confirmed',
  Dispatched: 'Dispatched with courier',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  'Pending Phone Confirmation': 'bg-amber-500',
  Confirmed: 'bg-blue-500',
  Dispatched: 'bg-purple-500',
  Delivered: 'bg-emerald-600',
  Cancelled: 'bg-rose-500',
};

const BADGE_CLASS: Record<OrderStatus, string> = {
  'Pending Phone Confirmation': 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
  Dispatched: 'bg-purple-50 text-purple-800 border-purple-200',
  Delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${BADGE_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Vertical order history, oldest first, the latest step last. */
export default function OrderTimeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-[#575757]">No updates yet.</p>;
  }

  return (
    <ol className="relative border-l border-[#E8DDD0] ml-1.5 space-y-5">
      {events.map((event, i) => {
        const isLatest = i === events.length - 1;
        return (
          <li key={`${event.at}-${i}`} className="pl-5 relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-2 ring-white ${
                STATUS_COLOR[event.status]
              }`}
            />
            <p className={`text-sm ${isLatest ? 'font-semibold text-[#0B0D12]' : 'text-[#1F1F1F]'}`}>
              {STATUS_LABEL[event.status]}
            </p>
            {event.note && <p className="text-xs text-[#575757] mt-0.5">{event.note}</p>}
            <time dateTime={event.at} className="text-[11px] text-[#8A8A8A] block mt-0.5">
              {formatWhen(event.at)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
