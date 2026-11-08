import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVariants,
  emptyForm,
  followProductPrices,
  formToProduct,
  moveItem,
  productToForm,
  productToSaveArgs,
  slugify,
  splitList,
  storagePathFromUrl,
  validateForm,
  validateImageFile,
  type ProductForm,
} from './product-form';

const defaults = { regularPrice: '2000', salePrice: '' };

function validForm(): ProductForm {
  const f = emptyForm();
  f.name = 'Royal Kundan Earrings';
  f.slug = 'royal-kundan-earrings';
  f.regularPrice = '2000';
  f.colors = 'Gold-tone, Silver';
  f.variants = buildVariants(['Gold-tone', 'Silver'], [], [], defaults);
  return f;
}

test('slugify makes a url-safe slug', () => {
  assert.equal(slugify("  Royal Kundan -- Chandbali's Set!  "), 'royal-kundan-chandbali-s-set');
});

test('splitList trims, drops empties and duplicates', () => {
  assert.deepEqual(splitList(' Gold, ,Silver,Gold '), ['Gold', 'Silver']);
});

test('buildVariants makes colour x size combinations, or one Default variant', () => {
  assert.equal(buildVariants(['A', 'B'], ['7', '8'], [], defaults).length, 4);
  const [only] = buildVariants([], [], [], defaults);
  assert.deepEqual([only.color, only.size, only.regularPrice, only.stockQty], ['', '', '2000', '0']);
});

test('buildVariants keeps id, sku and stock of combinations that already exist', () => {
  const existing = buildVariants(['A'], ['7'], [], defaults).map((v) => ({
    ...v,
    id: 'v1',
    sku: 'SKU-1',
    stockQty: '9',
  }));
  const out = buildVariants(['A', 'B'], ['7'], existing, defaults);
  assert.equal(out[0].id, 'v1');
  assert.equal(out[0].stockQty, '9');
  assert.equal(out[1].id, undefined);
  assert.equal(out[1].stockQty, '0');
});

test('followProductPrices updates matching variants and keeps overrides', () => {
  const vs = [
    { ...buildVariants([], [], [], defaults)[0] },
    { ...buildVariants([], [], [], defaults)[0], regularPrice: '2500' },
  ];
  const out = followProductPrices(vs, defaults, { regularPrice: '3000', salePrice: '2400' });
  assert.deepEqual(out.map((v) => v.regularPrice), ['3000', '2500']);
  assert.deepEqual(out.map((v) => v.salePrice), ['2400', '2400']);
});

test('validateForm accepts a valid form', () => {
  assert.deepEqual(validateForm(validForm()), {});
});

test('validateForm rejects bad name, slug and prices', () => {
  const f = validForm();
  f.name = 'x';
  f.slug = 'Bad Slug';
  f.regularPrice = '0';
  const e = validateForm(f);
  assert.ok(e.name && e.slug && e.regularPrice);
});

test('validateForm requires the sale price to be below the regular price', () => {
  const f = validForm();
  f.salePrice = '2000';
  assert.ok(validateForm(f).salePrice);
  f.salePrice = '1500';
  assert.equal(validateForm(f).salePrice, undefined);
});

test('validateForm flags duplicate combinations, duplicate SKUs and negative stock', () => {
  const f = validForm();
  f.variants = [
    { ...f.variants[0], sku: 'A-1' },
    { ...f.variants[0], color: 'GOLD-TONE', sku: 'a-2' }, // same combination, case-insensitive
    { ...f.variants[1], sku: 'A-1' }, // same SKU as row 0
    { ...f.variants[1], color: 'Rose', sku: '', stockQty: '-3' },
  ];
  const e = validateForm(f);
  assert.ok(e['variant-1']?.includes('combination'));
  assert.ok(e['variant-2']?.includes('SKU'));
  assert.ok(e['variant-3']?.includes('Stock'));
});

test('validateForm needs a variant, caps images, half-filled attributes and meta lengths', () => {
  const f = validForm();
  f.variants = [];
  f.images = Array.from({ length: 9 }, (_, i) => `https://x/${i}.webp`);
  f.attributes = [{ name: 'Material', value: '' }];
  f.metaTitle = 'x'.repeat(121);
  f.metaDescription = 'x'.repeat(321);
  const e = validateForm(f);
  assert.ok(e.variants && e.images && e.attributes && e.metaTitle && e.metaDescription);
});

test('form -> product -> form keeps the data, and derives price, colours and sizes', () => {
  const f = validForm();
  f.salePrice = '1500';
  f.sizes = '6, 7';
  f.variants = buildVariants(['Gold-tone', 'Silver'], ['6', '7'], [], { regularPrice: '2000', salePrice: '1500' });
  f.details = 'Brass base\n\nGold-tone plating';
  f.tags = 'kundan, bridal';
  f.attributes = [{ name: ' Material ', value: 'Brass' }, { name: '', value: '' }];
  const p = formToProduct(f);

  assert.equal(p.price, 1500);
  assert.equal(p.compareAtPrice, 2000);
  assert.deepEqual(p.colors, ['Gold-tone', 'Silver']);
  assert.deepEqual(p.sizes, ['6', '7']);
  assert.deepEqual(p.details, ['Brass base', 'Gold-tone plating']);
  assert.deepEqual(p.attributes, [{ name: 'Material', value: 'Brass' }]);
  assert.deepEqual(p.variants.map((v) => v.position), [0, 1, 2, 3]);

  const back = productToForm({ ...p, id: 'zj-1' });
  assert.equal(back.regularPrice, '2000');
  assert.equal(back.salePrice, '1500');
  assert.equal(back.colors, 'Gold-tone, Silver');
  assert.equal(back.details, 'Brass base\nGold-tone plating');
});

test('productToSaveArgs omits ids of new rows and sends nulls for empty optionals', () => {
  const args = productToSaveArgs(formToProduct(validForm()));
  assert.equal(JSON.parse(JSON.stringify(args.p_product)).id, undefined);
  assert.equal(args.p_product.salePrice, null);
  assert.equal(JSON.parse(JSON.stringify(args.p_variants[0])).id, undefined);
  assert.equal(args.p_variants[0].sku, null);
});

test('image helpers: file checks, storage path, reorder', () => {
  assert.equal(validateImageFile({ type: 'image/webp', size: 1000 }), null);
  assert.ok(validateImageFile({ type: 'image/svg+xml', size: 1000 }));
  assert.ok(validateImageFile({ type: 'image/png', size: 6 * 1024 * 1024 }));

  const url = 'https://abc.supabase.co/storage/v1/object/public/product-images/a%20b/c.webp?x=1';
  assert.equal(storagePathFromUrl(url), 'a b/c.webp');
  assert.equal(storagePathFromUrl('https://images.unsplash.com/photo-1'), null);

  assert.deepEqual(moveItem(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b']);
  assert.deepEqual(moveItem(['a', 'b'], 0, -1), ['a', 'b']);
});
