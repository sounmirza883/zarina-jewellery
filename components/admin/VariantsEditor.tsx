'use client';

import { RefreshCw } from 'lucide-react';
import { buildVariants, splitList, type VariantForm } from '@/lib/product-form';

interface VariantsEditorProps {
  colors: string;
  sizes: string;
  variants: VariantForm[];
  images: string[];
  regularPrice: string;
  salePrice: string;
  errors: Record<string, string>;
  onChange: (patch: { colors?: string; sizes?: string; variants?: VariantForm[] }) => void;
}

const input =
  'w-full px-2 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]';

export default function VariantsEditor({
  colors,
  sizes,
  variants,
  images,
  regularPrice,
  salePrice,
  errors,
  onChange,
}: VariantsEditorProps) {
  // Combinations are rebuilt only when the option fields are left, so half-typed names never replace real variants.
  const rebuild = () =>
    onChange({
      variants: buildVariants(splitList(colors), splitList(sizes), variants, { regularPrice, salePrice }),
    });

  const update = (index: number, patch: Partial<VariantForm>) =>
    onChange({ variants: variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) });

  const label = (v: VariantForm) => [v.color, v.size].filter(Boolean).join(' / ') || 'Default';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="pf-colors" className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
            Colours (comma-separated)
          </label>
          <input
            id="pf-colors"
            type="text"
            value={colors}
            onChange={(e) => onChange({ colors: e.target.value })}
            onBlur={rebuild}
            placeholder="Gold-tone, Silver finish"
            className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md focus:outline-hidden focus:border-[#B8893B]"
          />
        </div>
        <div>
          <label htmlFor="pf-sizes" className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
            Sizes (comma-separated)
          </label>
          <input
            id="pf-sizes"
            type="text"
            value={sizes}
            onChange={(e) => onChange({ sizes: e.target.value })}
            onBlur={rebuild}
            placeholder="6, 7, 8 or Adjustable"
            className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md focus:outline-hidden focus:border-[#B8893B]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={rebuild}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E8DDD0] rounded-md text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF7F2]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Update combinations</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ variants: variants.map((v) => ({ ...v, regularPrice, salePrice })) })}
          className="px-3 py-1.5 border border-[#E8DDD0] rounded-md text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF7F2]"
        >
          Apply product prices to all variants
        </button>
        <span className="text-[11px] text-[#8A8A8A]">
          Leave both lists empty for a product without options. Removed combinations are hidden from the shop, not deleted.
        </span>
      </div>

      {errors.variants && (
        <p role="alert" className="text-xs text-rose-700">
          {errors.variants}
        </p>
      )}

      <div className="overflow-x-auto border border-[#E8DDD0] rounded-md">
        <table className="w-full text-xs min-w-[720px]">
          <thead className="bg-[#FAF7F2] text-[#575757] uppercase tracking-wider text-[10px]">
            <tr>
              <th className="text-left px-2 py-2 font-semibold">Variant</th>
              <th className="text-left px-2 py-2 font-semibold">SKU</th>
              <th className="text-left px-2 py-2 font-semibold">Regular</th>
              <th className="text-left px-2 py-2 font-semibold">Sale</th>
              <th className="text-left px-2 py-2 font-semibold">Stock</th>
              <th className="text-left px-2 py-2 font-semibold">Image</th>
              <th className="text-center px-2 py-2 font-semibold">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FAF7F2]">
            {variants.map((v, i) => (
              <tr key={`${v.color}|${v.size}`} className={v.active ? '' : 'opacity-60'}>
                <td className="px-2 py-2 align-top font-medium text-[#0B0D12]">
                  {label(v)}
                  {errors[`variant-${i}`] && (
                    <p role="alert" className="mt-1 font-normal text-rose-700 whitespace-normal">
                      {errors[`variant-${i}`]}
                    </p>
                  )}
                </td>
                <td className="px-2 py-2 align-top">
                  <input
                    aria-label={`SKU for ${label(v)}`}
                    type="text"
                    value={v.sku}
                    onChange={(e) => update(i, { sku: e.target.value })}
                    className={`${input} w-32`}
                  />
                </td>
                <td className="px-2 py-2 align-top">
                  <input
                    aria-label={`Regular price for ${label(v)}`}
                    type="number"
                    min={0}
                    step={1}
                    value={v.regularPrice}
                    onChange={(e) => update(i, { regularPrice: e.target.value })}
                    className={`${input} w-24`}
                  />
                </td>
                <td className="px-2 py-2 align-top">
                  <input
                    aria-label={`Sale price for ${label(v)}`}
                    type="number"
                    min={0}
                    step={1}
                    value={v.salePrice}
                    onChange={(e) => update(i, { salePrice: e.target.value })}
                    placeholder="None"
                    className={`${input} w-24`}
                  />
                </td>
                <td className="px-2 py-2 align-top">
                  <input
                    aria-label={`Stock for ${label(v)}`}
                    type="number"
                    min={0}
                    step={1}
                    value={v.stockQty}
                    onChange={(e) => update(i, { stockQty: e.target.value })}
                    className={`${input} w-20`}
                  />
                </td>
                <td className="px-2 py-2 align-top">
                  <select
                    aria-label={`Image for ${label(v)}`}
                    value={v.imageUrl}
                    onChange={(e) => update(i, { imageUrl: e.target.value })}
                    className={`${input} w-32`}
                  >
                    <option value="">Product image</option>
                    {images.map((url, n) => (
                      <option key={url} value={url}>
                        Image {n + 1}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2 align-top text-center">
                  <input
                    aria-label={`${label(v)} is active`}
                    type="checkbox"
                    checked={v.active}
                    onChange={(e) => update(i, { active: e.target.checked })}
                    className="rounded text-[#B8893B] focus:ring-[#B8893B]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
