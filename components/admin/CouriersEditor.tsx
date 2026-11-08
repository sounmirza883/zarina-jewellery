'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { Courier } from '@/types/product';

const inputClass =
  'w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]';

/** Settings-tab editor for the courier list shown in the dispatch panel and on the tracking page. */
export default function CouriersEditor({
  couriers,
  onChange,
}: {
  couriers: Courier[];
  onChange: (couriers: Courier[]) => void;
}) {
  const update = (index: number, patch: Partial<Courier>) =>
    onChange(couriers.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wider text-[#1F1F1F]">Couriers</legend>
      <p className="text-[11px] text-[#575757]">
        Use <code className="font-mono">{'{tracking}'}</code> in the link where the tracking number goes, for
        example <code className="font-mono">https://courier.example/track?cn={'{tracking}'}</code>. Leave the
        link empty to show only the tracking number.
      </p>

      {couriers.map((courier, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-center">
          <input
            aria-label={`Courier ${i + 1} name`}
            value={courier.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Courier name"
            maxLength={60}
            className={inputClass}
          />
          <input
            aria-label={`Courier ${i + 1} tracking link`}
            type="url"
            value={courier.trackingUrl}
            onChange={(e) => update(i, { trackingUrl: e.target.value })}
            placeholder="https://… {tracking}"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(couriers.filter((_, idx) => idx !== i))}
            aria-label={`Remove courier ${courier.name || i + 1}`}
            className="p-2 text-[#991B1B] hover:bg-rose-50 rounded justify-self-start"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...couriers, { name: '', trackingUrl: '' }])}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B8893B] hover:text-[#0B0D12]"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add courier</span>
      </button>
    </fieldset>
  );
}
