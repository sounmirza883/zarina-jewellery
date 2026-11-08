'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Trash2, X } from 'lucide-react';
import type { Product, ProductCategory } from '@/types/product';
import { discountPercent } from '@/lib/pricing';
import { formatPKR } from '@/lib/shop-logic';
import { fetchProduct, saveProduct } from '@/lib/admin-store';
import {
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
  emptyForm,
  followProductPrices,
  formToProduct,
  productToForm,
  slugify,
  validateForm,
  type ProductForm,
} from '@/lib/product-form';
import ImageUploader from './ImageUploader';
import VariantsEditor from './VariantsEditor';

interface ProductFormModalProps {
  open: boolean;
  product: Product | null; // null = add a new product
  onClose: () => void;
  onSaved: (saved: Product) => void;
}

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'earrings', label: 'Earrings' },
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'rings', label: 'Rings' },
  { value: 'bracelets', label: 'Bracelets' },
];

const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1';
const inputCls =
  'w-full px-3 py-2 text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]';
const border = (error?: string) => (error ? 'border-rose-500' : 'border-[#E8DDD0]');

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[11px] text-[#8A8A8A] mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[11px] text-rose-700 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="pt-5 mt-5 border-t border-[#E8DDD0] first:mt-0 first:pt-0 first:border-t-0 space-y-4">
      <h4 id={id} className="font-serif text-lg font-medium text-[#0B0D12]">
        {title}
      </h4>
      {children}
    </section>
  );
}

function ModalBody({ product, onClose, onSaved }: Omit<ProductFormModalProps, 'open'>) {
  const [form, setForm] = useState<ProductForm>(() => (product ? productToForm(product) : emptyForm()));
  const [slugTouched, setSlugTouched] = useState(product !== null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const productId = product?.id;

  // Orders change stock while the product list sits open, so pull the current stock when the editor opens.
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    fetchProduct(productId)
      .then((fresh) => {
        if (cancelled || !fresh) return;
        const stock = new Map(fresh.variants.map((v) => [v.id, String(v.stockQty)]));
        setForm((f) => ({
          ...f,
          variants: f.variants.map((v) => (v.id && stock.has(v.id) ? { ...v, stockQty: stock.get(v.id)! } : v)),
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (patch: Partial<ProductForm>) => setForm((f) => ({ ...f, ...patch }));

  const setPricing = (patch: { regularPrice?: string; salePrice?: string }) =>
    setForm((f) => {
      const next = {
        regularPrice: patch.regularPrice ?? f.regularPrice,
        salePrice: patch.salePrice ?? f.salePrice,
      };
      const prev = { regularPrice: f.regularPrice, salePrice: f.salePrice };
      return { ...f, ...next, variants: followProductPrices(f.variants, prev, next) };
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateForm(form);
    setErrors(found);
    const messages = Object.values(found);
    if (messages.length > 0) {
      setSaveError(`Please fix ${messages.length} problem${messages.length === 1 ? '' : 's'} before saving: ${messages.slice(0, 3).join(' ')}`);
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const id = await saveProduct(formToProduct(form));
      const saved = await fetchProduct(id);
      if (!saved) throw new Error('The product was saved but could not be reloaded. Refresh the page.');
      onSaved(saved);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save the product.');
      setSaving(false);
    }
  };

  const regular = Number(form.regularPrice);
  const sale = form.salePrice.trim() !== '' ? Number(form.salePrice) : undefined;
  const selling = sale !== undefined && sale > 0 && sale < regular ? sale : regular;
  const percent = Number.isFinite(regular) ? discountPercent(regular, selling) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-title"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#B8893B]/30 px-6 sm:px-8"
      >
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between py-5 border-b border-[#E8DDD0]">
          <h3 id="pf-title" className="font-serif text-2xl font-normal text-[#0B0D12]">
            {product ? 'Edit Jewellery Piece' : 'Add New Jewellery Piece'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#575757]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="py-5 text-xs">
          {/* ---------- General ---------- */}
          <Section id="pf-general" title="General">
            <Field id="pf-name" label="Piece name *" error={errors.name}>
              <input
                id="pf-name"
                type="text"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  set(slugTouched ? { name } : { name, slug: slugify(name) });
                }}
                placeholder="e.g. Royal Emerald Kundan Choker Set"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'pf-name-error' : undefined}
                className={`${inputCls} ${border(errors.name)}`}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="pf-slug" label="URL slug *" error={errors.slug} hint="Used in the page address: /product/your-slug">
                <input
                  id="pf-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set({ slug: e.target.value });
                  }}
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={errors.slug ? 'pf-slug-error' : 'pf-slug-hint'}
                  className={`${inputCls} ${border(errors.slug)}`}
                />
              </Field>
              <Field id="pf-category" label="Category *">
                <select
                  id="pf-category"
                  value={form.category}
                  onChange={(e) => set({ category: e.target.value as ProductCategory })}
                  className={`${inputCls} ${border()}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <fieldset className="flex flex-wrap items-center gap-5">
              <legend className="sr-only">Product flags</legend>
              {(
                [
                  ['isNew', 'Mark as New Arrival'],
                  ['isBestSeller', 'Mark as Best Seller'],
                  ['inStock', 'Listed in the shop'],
                ] as const
              ).map(([key, text]) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set({ [key]: e.target.checked })}
                    className="rounded text-[#B8893B] focus:ring-[#B8893B]"
                  />
                  <span className="font-medium text-[#1F1F1F]">{text}</span>
                </label>
              ))}
            </fieldset>

            <Field id="pf-short" label="Short description" hint="One or two lines shown on the product card and in search results.">
              <textarea
                id="pf-short"
                rows={2}
                value={form.shortDescription}
                onChange={(e) => set({ shortDescription: e.target.value })}
                aria-describedby="pf-short-hint"
                className={`${inputCls} ${border()}`}
              />
            </Field>

            <Field id="pf-desc" label="Full description" hint="Blank lines start a new paragraph.">
              <textarea
                id="pf-desc"
                rows={6}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                aria-describedby="pf-desc-hint"
                className={`${inputCls} ${border()}`}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="pf-details" label="Highlights" hint="One per line, for example: Gold-tone anti-tarnish plating.">
                <textarea
                  id="pf-details"
                  rows={4}
                  value={form.details}
                  onChange={(e) => set({ details: e.target.value })}
                  aria-describedby="pf-details-hint"
                  className={`${inputCls} ${border()}`}
                />
              </Field>
              <Field id="pf-tags" label="Tags (comma-separated)" hint="Used by shop search, for example kundan, bridal, festive.">
                <input
                  id="pf-tags"
                  type="text"
                  value={form.tags}
                  onChange={(e) => set({ tags: e.target.value })}
                  aria-describedby="pf-tags-hint"
                  className={`${inputCls} ${border()}`}
                />
              </Field>
            </div>
          </Section>

          {/* ---------- Pricing ---------- */}
          <Section id="pf-pricing" title="Pricing">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field id="pf-regular" label="Regular price (PKR) *" error={errors.regularPrice}>
                <input
                  id="pf-regular"
                  type="number"
                  min={0}
                  step={1}
                  value={form.regularPrice}
                  onChange={(e) => setPricing({ regularPrice: e.target.value })}
                  aria-invalid={Boolean(errors.regularPrice)}
                  aria-describedby={errors.regularPrice ? 'pf-regular-error' : undefined}
                  className={`${inputCls} ${border(errors.regularPrice)}`}
                />
              </Field>
              <Field id="pf-sale" label="Sale price (PKR)" error={errors.salePrice} hint="Optional. Must be lower than the regular price.">
                <input
                  id="pf-sale"
                  type="number"
                  min={0}
                  step={1}
                  value={form.salePrice}
                  onChange={(e) => setPricing({ salePrice: e.target.value })}
                  aria-invalid={Boolean(errors.salePrice)}
                  aria-describedby={errors.salePrice ? 'pf-sale-error' : 'pf-sale-hint'}
                  className={`${inputCls} ${border(errors.salePrice)}`}
                />
              </Field>
              <div>
                <span className={labelCls}>Selling price</span>
                <p className="px-3 py-2 text-sm font-semibold text-[#0B0D12] bg-[#F5EDE1] rounded-md" aria-live="polite">
                  {Number.isFinite(selling) && selling > 0 ? formatPKR(selling) : '—'}
                  {percent > 0 && <span className="ml-2 text-emerald-700 text-xs">{percent}% off</span>}
                </p>
                <p className="text-[11px] text-[#8A8A8A] mt-1">What customers pay: the sale price if set, otherwise the regular price.</p>
              </div>
            </div>
            <p className="text-[11px] text-[#8A8A8A]">
              Variants copy these prices automatically while they still match; change a variant&apos;s price in the table below to override it.
            </p>
          </Section>

          {/* ---------- Variants ---------- */}
          <Section id="pf-variants" title="Variants and stock">
            <VariantsEditor
              colors={form.colors}
              sizes={form.sizes}
              variants={form.variants}
              images={form.images}
              regularPrice={form.regularPrice}
              salePrice={form.salePrice}
              errors={errors}
              onChange={set}
            />
          </Section>

          {/* ---------- Images ---------- */}
          <Section id="pf-images" title="Images">
            <ImageUploader images={form.images} onChange={(images) => set({ images })} error={errors.images} />
          </Section>

          {/* ---------- Attributes ---------- */}
          <Section id="pf-attributes" title="Attributes">
            <p className="text-[11px] text-[#8A8A8A]">Specifications shown on the product page, for example Material: Brass, Finish: Gold-tone.</p>
            <div className="space-y-2">
              {form.attributes.map((attr, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    aria-label={`Attribute ${i + 1} name`}
                    type="text"
                    value={attr.name}
                    placeholder="Name"
                    onChange={(e) =>
                      set({ attributes: form.attributes.map((a, n) => (n === i ? { ...a, name: e.target.value } : a)) })
                    }
                    className={`${inputCls} ${border(errors.attributes)}`}
                  />
                  <input
                    aria-label={`Attribute ${i + 1} value`}
                    type="text"
                    value={attr.value}
                    placeholder="Value"
                    onChange={(e) =>
                      set({ attributes: form.attributes.map((a, n) => (n === i ? { ...a, value: e.target.value } : a)) })
                    }
                    className={`${inputCls} ${border(errors.attributes)}`}
                  />
                  <button
                    type="button"
                    onClick={() => set({ attributes: form.attributes.filter((_, n) => n !== i) })}
                    className="p-2 text-rose-700 hover:bg-rose-50 rounded"
                    aria-label={`Remove attribute ${i + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {errors.attributes && (
              <p role="alert" className="text-[11px] text-rose-700">
                {errors.attributes}
              </p>
            )}
            <button
              type="button"
              onClick={() => set({ attributes: [...form.attributes, { name: '', value: '' }] })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E8DDD0] rounded-md font-semibold text-[#1F1F1F] hover:bg-[#FAF7F2]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add attribute</span>
            </button>
          </Section>

          {/* ---------- SEO ---------- */}
          <Section id="pf-seo" title="SEO (search engines and link previews)">
            <Field
              id="pf-meta-title"
              label="Meta title"
              error={errors.metaTitle}
              hint={`${form.metaTitle.length}/${META_TITLE_MAX}. Leave empty to use the product name.`}
            >
              <input
                id="pf-meta-title"
                type="text"
                value={form.metaTitle}
                onChange={(e) => set({ metaTitle: e.target.value })}
                aria-invalid={Boolean(errors.metaTitle)}
                aria-describedby={errors.metaTitle ? 'pf-meta-title-error' : 'pf-meta-title-hint'}
                className={`${inputCls} ${border(errors.metaTitle)}`}
              />
            </Field>
            <Field
              id="pf-meta-desc"
              label="Meta description"
              error={errors.metaDescription}
              hint={`${form.metaDescription.length}/${META_DESCRIPTION_MAX}. Leave empty to use the short description.`}
            >
              <textarea
                id="pf-meta-desc"
                rows={3}
                value={form.metaDescription}
                onChange={(e) => set({ metaDescription: e.target.value })}
                aria-invalid={Boolean(errors.metaDescription)}
                aria-describedby={errors.metaDescription ? 'pf-meta-desc-error' : 'pf-meta-desc-hint'}
                className={`${inputCls} ${border(errors.metaDescription)}`}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="pf-meta-keywords" label="Meta keywords (comma-separated)">
                <input
                  id="pf-meta-keywords"
                  type="text"
                  value={form.metaKeywords}
                  onChange={(e) => set({ metaKeywords: e.target.value })}
                  className={`${inputCls} ${border()}`}
                />
              </Field>
              <Field id="pf-og" label="Link preview image" hint="Shown when the page is shared. Defaults to the main image.">
                <select
                  id="pf-og"
                  value={form.ogImage}
                  onChange={(e) => set({ ogImage: e.target.value })}
                  aria-describedby="pf-og-hint"
                  className={`${inputCls} ${border()}`}
                >
                  <option value="">Main image</option>
                  {form.images.map((url, n) => (
                    <option key={url} value={url}>
                      Image {n + 1}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {saveError && (
            <p role="alert" className="mt-5 p-3 rounded-md border border-rose-200 bg-rose-50 text-rose-800">
              {saveError}
            </p>
          )}

          <div className="sticky bottom-0 bg-white mt-5 pt-4 pb-5 border-t border-[#E8DDD0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E8DDD0] text-[#575757] rounded-md hover:bg-[#FAF7F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#0B0D12] hover:bg-[#B8893B] disabled:opacity-60 text-white font-semibold uppercase tracking-wider rounded-md transition-colors"
            >
              {saving ? 'Saving…' : product ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ProductFormModal({ open, product, onClose, onSaved }: ProductFormModalProps) {
  return (
    <AnimatePresence>
      {open && <ModalBody key={product?.id ?? 'new'} product={product} onClose={onClose} onSaved={onSaved} />}
    </AnimatePresence>
  );
}
