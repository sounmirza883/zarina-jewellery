-- =====================================================================
-- Zarina Jewels: the ONE database file (Supabase / Postgres)
--
-- Run this whole file once in Supabase Dashboard -> SQL Editor.
-- It is safe to run again later: it only adds what is missing and never
-- drops columns or overwrites products, settings or orders that exist.
-- Run it BEFORE deploying the matching app code.
--
-- What it sets up
--   products          prices (regular / sale / selling), short + long description,
--                     attributes, SEO meta, rating summary
--   product_variants  colour/size combinations with SKU, price, stock, image
--   reviews           customer reviews, hidden until the admin approves them
--   profiles          customer accounts (name, phone, saved address)
--   orders            + customer link, coupon discount
--   coupons           discount coupons (percent, fixed amount, free delivery)
--   wishlist_items    each customer's saved products (signed-in customers only)
--   contact_messages  messages sent from the Contact Us form, read in the admin
--   store_settings    shipping rules, announcement bar
--   product-images    Storage bucket for admin image uploads
--
-- After running it
--   1. Authentication -> Users: add your admin user (email + password).
--   2. Make that user an admin. Only the dashboard/SQL can set app_metadata,
--      so a customer can never grant it to themselves:
--        update auth.users
--           set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--         where email = 'you@example.com';
--   3. Authentication -> Providers -> Email: leave "Allow new users to sign up" ON
--      (customers create accounts). Admin access never depends on that setting.
--   4. Authentication -> URL Configuration: set the Site URL to your website and add
--      <your site>/auth/callback to the Redirect URLs.
--   5. Before real customers sign up, connect your own SMTP provider
--      (Authentication -> Emails -> SMTP). The built-in sender has a very low hourly limit.
--   6. Put the project URL and the anon/publishable key in .env. Never use the
--      service_role key in the website.
--
-- Access model
--   products, product_variants, store_settings   public read, admin write
--   coupons           admin only; customers check a code with validate_coupon()
--   wishlist_items    each customer reads and changes only their own rows
--   contact_messages  admin only; visitors can only send through submit_contact()
--   reviews           public sees approved ones only; visitors add reviews through
--                     submit_review(); admin approves or deletes
--   orders            visitors have NO direct access: they place orders through
--                     place_order(). Signed-in customers can read their own orders.
--                     Only the admin can change or delete orders.
--   profiles          each customer reads/edits only their own row
--
-- Calls the app makes
--   rpc('place_order',   { p_lines: [{ variantId, quantity }], p_customer: {...}, p_coupon })  -- p_coupon optional
--   rpc('validate_coupon', { p_code, p_lines: [{ variantId, quantity }] })   -- checkout preview
--   rpc('wishlist_merge', { p_ids: ['zj-ring-01', ...] })                    -- signed-in customers
--   rpc('submit_contact', { p_name, p_phone, p_email, p_subject, p_message, p_hp })
--   rpc('submit_review', { p_product_id, p_rating, p_author, p_title, p_body, p_hp })
--   rpc('save_product',  { p_product: {...}, p_variants: [...] })      -- admin only
-- place_order also still accepts the older { productId, color, size, quantity } lines.
--
-- Re-running notes
--   * It adds back any of the 16 starter products you deleted from the catalogue.
--   * It creates a default variant for any product that has none. If you added a product with
--     an older version of the admin after running this file, run the file again once the new
--     code is deployed.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Core tables (created only if missing)
-- ---------------------------------------------------------------------

create table if not exists public.products (
  id               text primary key,
  slug             text not null unique,
  name             text not null,
  category         text not null check (category in ('earrings', 'necklaces', 'rings', 'bracelets')),
  price            integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price >= 0),
  images           text[] not null default '{}',
  colors           text[] not null default '{}',
  sizes            text[],
  description      text not null default '',
  details          text[] not null default '{}',
  tags             text[] not null default '{}',
  is_new           boolean not null default false,
  is_best_seller   boolean not null default false,
  in_stock         boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.orders (
  order_number   text primary key,
  items          jsonb not null,
  subtotal       integer not null check (subtotal >= 0),
  shipping       integer not null check (shipping >= 0),
  total          integer not null check (total >= 0),
  customer       jsonb not null,
  payment_method text not null default 'Cash on Delivery',
  status         text not null default 'Pending Phone Confirmation'
                 check (status in ('Pending Phone Confirmation', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled')),
  created_at     timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- One row only (id is forced to true). `data` holds the admin Settings tab values.
create table if not exists public.store_settings (
  id   boolean primary key default true check (id),
  data jsonb not null default '{}'::jsonb
);


-- ---------------------------------------------------------------------
-- 2. New product fields
--    price          = the selling price customers pay (kept in sync by a trigger)
--    regular_price  = the normal list price
--    sale_price     = optional discounted price (must be below regular_price)
--    in_stock       = "listed in the shop"; sold out is derived from variant stock
-- ---------------------------------------------------------------------

alter table public.products
  add column if not exists regular_price     integer,
  add column if not exists sale_price        integer,
  add column if not exists short_description text not null default '',
  add column if not exists attributes        jsonb not null default '[]'::jsonb,
  add column if not exists meta_title        text,
  add column if not exists meta_description  text,
  add column if not exists meta_keywords     text[] not null default '{}',
  add column if not exists og_image          text,
  add column if not exists updated_at        timestamptz not null default now(),
  add column if not exists rating_avg        numeric(3, 2) not null default 0,
  add column if not exists rating_count      integer not null default 0;

do $$ begin
  alter table public.products add constraint products_regular_price_check
    check (regular_price is null or regular_price >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.products add constraint products_sale_below_regular
    check (sale_price is null or regular_price is null or sale_price < regular_price);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.products add constraint products_attributes_is_array
    check (jsonb_typeof(attributes) = 'array');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.products add constraint products_meta_lengths
    check (coalesce(length(meta_title), 0) <= 120 and coalesce(length(meta_description), 0) <= 320);
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 3. Admin check
-- ---------------------------------------------------------------------

-- True when the signed-in user's JWT carries app_metadata.role = 'admin'.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;


-- ---------------------------------------------------------------------
-- 4. Keep the selling price in sync
--    New code writes regular_price + sale_price. Older code that only writes
--    price (+ compare_at_price) is understood too, so nothing breaks during
--    a deploy.
-- ---------------------------------------------------------------------

create or replace function public.products_price_sync()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_legacy boolean;
begin
  if tg_op = 'INSERT' then
    v_legacy := new.regular_price is null;
  else
    v_legacy := new.regular_price is not distinct from old.regular_price
            and new.sale_price    is not distinct from old.sale_price
            and (new.price is distinct from old.price
                 or new.compare_at_price is distinct from old.compare_at_price);
  end if;

  if v_legacy then
    if new.compare_at_price is not null and new.compare_at_price > new.price then
      new.regular_price := new.compare_at_price;
      new.sale_price    := new.price;
    else
      new.regular_price := new.price;
      new.sale_price    := null;
    end if;
  end if;

  new.price            := coalesce(new.sale_price, new.regular_price);
  new.compare_at_price := case when new.sale_price is not null then new.regular_price end;
  return new;
end;
$$;

drop trigger if exists products_price_sync_trg on public.products;
create trigger products_price_sync_trg
  before insert or update on public.products
  for each row execute function public.products_price_sync();


-- ---------------------------------------------------------------------
-- 5. Variants (one row per colour/size combination; simple products get a
--    single "Default" variant). Cart, orders and stock all use the variant.
-- ---------------------------------------------------------------------

create table if not exists public.product_variants (
  id            text primary key default gen_random_uuid()::text,
  product_id    text not null references public.products (id) on delete cascade,
  sku           text,
  color         text not null default '',
  size          text not null default '',
  regular_price integer not null check (regular_price >= 0),
  sale_price    integer check (sale_price >= 0),
  stock_qty     integer not null default 0 check (stock_qty >= 0),
  image_url     text,
  position      integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint product_variants_sale_below_regular check (sale_price is null or sale_price < regular_price),
  constraint product_variants_unique_combo unique (product_id, color, size)
);

create unique index if not exists product_variants_sku_key
  on public.product_variants (sku) where sku is not null;
create index if not exists product_variants_product_idx
  on public.product_variants (product_id);


-- ---------------------------------------------------------------------
-- 6. Reviews (visitors submit through submit_review(); nothing shows until approved)
-- ---------------------------------------------------------------------

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,
  rating      smallint not null check (rating between 1 and 5),
  author_name text not null check (length(author_name) between 2 and 60),
  title       text not null default '' check (length(title) <= 100),
  body        text not null check (length(body) between 10 and 2000),
  status      text not null default 'pending' check (status in ('pending', 'approved')),
  is_verified boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_product_status_idx
  on public.reviews (product_id, status, created_at desc);


-- ---------------------------------------------------------------------
-- 7. Customer profiles (one row per auth user; created automatically)
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '' check (length(full_name) <= 100),
  phone      text not null default '' check (length(phone) <= 20),
  province   text not null default '' check (length(province) <= 60),
  city       text not null default '' check (length(city) <= 80),
  address    text not null default '' check (length(address) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 8. Orders: link to the customer account, coupon discount, and the coupons table
-- ---------------------------------------------------------------------

alter table public.orders
  add column if not exists user_id     uuid references auth.users (id) on delete set null,
  add column if not exists discount    integer not null default 0 check (discount >= 0),
  add column if not exists coupon_code text;

create index if not exists orders_user_idx
  on public.orders (user_id, created_at desc) where user_id is not null;

create index if not exists orders_coupon_idx
  on public.orders (coupon_code) where coupon_code is not null;

-- total = items - coupon discount + delivery. orders_check is the older rule without a discount.
alter table public.orders drop constraint if exists orders_check;
alter table public.orders drop constraint if exists orders_total_check;
alter table public.orders
  add constraint orders_total_check check (discount <= subtotal and total = subtotal - discount + shipping);

-- Discount coupons (admin only; customers use them through validate_coupon() and place_order()).
--   kind   percent       value = 1..100 (% off the eligible items)
--          fixed         value = rupees off the eligible items
--          free_shipping value = 0 (delivery charge removed)
--   categories  empty = every category; otherwise only items in these categories count
--   include_sale_items  false = items that already show a sale price are left out
-- Uses are counted from non-cancelled orders, so a cancelled order gives its use back.
create table if not exists public.coupons (
  code               text primary key check (code ~ '^[A-Z0-9_-]{3,20}$'),
  kind               text not null check (kind in ('percent', 'fixed', 'free_shipping')),
  value              integer not null default 0 check (value >= 0),
  categories         text[] not null default '{}'
                     check (categories <@ array['earrings', 'necklaces', 'rings', 'bracelets']::text[]),
  min_subtotal       integer not null default 0 check (min_subtotal >= 0),
  include_sale_items boolean not null default true,
  starts_at          timestamptz,
  expires_at         timestamptz,
  usage_limit        integer check (usage_limit is null or usage_limit >= 1),
  once_per_customer  boolean not null default false,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  check ((kind = 'percent' and value between 1 and 100)
      or (kind = 'fixed' and value >= 1)
      or (kind = 'free_shipping' and value = 0)),
  check (starts_at is null or expires_at is null or expires_at > starts_at)
);

-- Saved products. The primary key and the foreign keys cap a customer's rows at the number of products,
-- and deleting a product or an account removes the rows. Guests keep their list in the browser instead.
create table if not exists public.wishlist_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- Messages from the Contact Us form. Visitors have no access to this table: they send through
-- submit_contact(); only the admin reads, marks handled and deletes.
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null check (length(full_name) between 3 and 100),
  phone      text not null check (length(phone) between 10 and 20),
  email      text not null default '' check (length(email) <= 254),
  subject    text not null check (length(subject) between 3 and 150),
  message    text not null check (length(message) between 10 and 2000),
  status     text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status, created_at desc);
create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);


-- ---------------------------------------------------------------------
-- 9. Settings + seed products
-- ---------------------------------------------------------------------

insert into public.store_settings (id, data)
values (true, '{"flatShippingRate": 250, "freeShippingThreshold": 3500}'::jsonb)
on conflict (id) do nothing;

-- Seed products (data/products.ts). Existing rows are left untouched.
insert into public.products
  (id, slug, name, category, price, compare_at_price, images, colors, sizes, description, details, tags, is_new, is_best_seller, in_stock, created_at)
values
  ('zj-ear-01', 'royal-kundan-chandbali-earrings', 'Royal Kundan Chandbali Earrings', 'earrings', 2450, 2950, array['https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone with Ivory Pearl', 'Gold-tone with Emerald Green Beads']::text[], null, 'Exquisite moon-crescent chandbali earrings adorned with glass kundan stones and dangling faux pearl drops. Ideal for weddings and festive evenings.', array['High-grade brass base with micro gold-tone plating', 'Embellished with hand-set glass kundan and faux seed pearls', 'Secure push-back closure with soft rubber comfort pads', 'Length: Approx. 7.5 cm | Weight: Light-to-medium festive wear', 'Care: Store in an airtight pouch and avoid contact with perfume or water']::text[], array['chandbali', 'kundan', 'wedding', 'festive', 'traditional']::text[], true, true, true, now() - interval '0 minutes'),
  ('zj-ear-02', 'polki-jhumka-heritage-drops', 'Polki Jhumka Heritage Drops', 'earrings', 2150, 2600, array['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80']::text[], array['Antique Gold-tone', 'Bright Gold-tone']::text[], null, 'Classic bell-shaped jhumkas featuring delicate filigree work, uncut polki-style glass work, and rhythmic mini bead clusters that sway gently.', array['Antique gold-tone polished metal alloy', 'Uncut polki stone finish with intricate floral top stud', 'Traditional hollow dome jhumka bell for comfortable wear', 'Length: Approx. 6.0 cm | Hypoallergenic ear posts', 'Care: Wipe gently with a dry cotton cloth after wearing']::text[], array['jhumka', 'polki', 'heritage', 'traditional']::text[], false, true, true, now() - interval '1 minutes'),
  ('zj-ear-03', 'minimalist-zircon-solitaire-studs', 'Minimalist Zircon Solitaire Studs', 'earrings', 1450, 1750, array['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone', 'Silver-tone Rhodium Finish']::text[], null, 'Brilliant round-cut cubic zirconia studs in a timeless 4-prong basket setting. Provides clean, everyday sparkle for work, university, or dining out.', array['Premium AAA-grade cubic zirconia faceted stones', 'Long-lasting electroplated gold-tone and rhodium finish', 'Stone diameter: 7mm equivalent sparkle', 'Comfort-fit butterfly clutch backings included', 'Lead and nickel safe for sensitive ears']::text[], array['studs', 'zircon', 'everyday', 'minimalist', 'office']::text[], true, false, true, now() - interval '2 minutes'),
  ('zj-ear-04', 'faux-pearl-drop-huggie-hoops', 'Faux Pearl Drop Huggie Hoops', 'earrings', 1650, 1950, array['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone with Cream Pearl', 'Rose Gold-tone']::text[], null, 'Chic huggie hoop earrings featuring micro-pave zircon crystals with a suspended baroque-style imitation pearl for an effortlessly graceful aesthetic.', array['Warm gold-tone electroplating on copper alloy', 'Lustrous shell faux pearl pendant drop (detachable)', 'Secure click-latch closure for all-day comfort', 'Total Drop: 3.2 cm | Hoop diameter: 14 mm', 'Can be worn as simple pavé hoops by slipping off the pearl drop']::text[], array['hoops', 'pearl', 'modern', 'elegant']::text[], false, false, true, now() - interval '3 minutes'),
  ('zj-neck-01', 'noor-bridal-gold-tone-choker-set', 'Noor Bridal Gold-Tone Choker Set', 'necklaces', 4850, 5950, array['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone with Champagne Zircon', 'Gold-tone with Ruby Red Accents']::text[], null, 'A regal wedding choker set complete with matching statement drop earrings and maang tikka. Hand-set with sparkling cubic zirconia and kundan motifs.', array['Complete 3-piece set: Choker necklace, matching earrings, and maang tikka', 'Rich 22K style gold-tone micro finish with protective clear coat', 'Adjustable embroidered zari dori drawstring fits all neck sizes', 'Studded with premium champagne cubic zirconia crystals', 'Packaged in a signature Zarina Jewels keepsake box']::text[], array['choker', 'bridal', 'set', 'kundan', 'wedding']::text[], true, true, true, now() - interval '4 minutes'),
  ('zj-neck-02', 'emerald-green-crystal-rani-mala', 'Emerald Green Crystal Rani Mala', 'necklaces', 3650, 4200, array['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80']::text[], array['Emerald Green Beads with Gold-tone', 'Ruby Pink Beads with Gold-tone']::text[], null, 'Stately multi-string long necklace featuring hydro-cut emerald green crystal beads joined by an ornate gold-tone pendant studded with sparkling zircons.', array['Five graduated strands of faceted glass crystal beads', 'Antique gold-tone floral medallion pendant with faux pearl fringe', 'Includes matching stud drop earrings', 'Necklace length: 24 inches with adjustable back cord', 'Care: Keep away from moisture and store flat']::text[], array['rani haar', 'mala', 'emerald', 'traditional', 'festive']::text[], false, true, true, now() - interval '5 minutes'),
  ('zj-neck-03', 'delicate-solitaire-zircon-pendant', 'Delicate Solitaire Zircon Pendant', 'necklaces', 1950, 2400, array['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone', 'Rose Gold-tone', 'Silver-tone']::text[], null, 'An understated everyday luxury. A bezel-set heart-of-light cubic zirconia stone on a fine cable link chain with an adjustable 2-inch extender.', array['Fine cable chain with anti-tarnish protective coating', 'Flawless 1.5-carat equivalent round brilliant cubic zirconia', 'Chain length: 16 inches + 2 inch extender chain', 'Spring ring clasp closure', 'Minimalist design suitable for everyday and formal layering']::text[], array['pendant', 'minimalist', 'zircon', 'chain', 'daily wear']::text[], true, false, true, now() - interval '6 minutes'),
  ('zj-neck-04', 'vintage-mughal-layered-haar', 'Vintage Mughal Layered Haar', 'necklaces', 4200, 4900, array['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1000&q=80']::text[], array['Antique Gold-tone with Faux Pearls']::text[], null, 'Inspired by Mughal court portraiture, this cascading 3-tier haar features filigree motifs and delicate rice-pearl imitation strings.', array['Layered 3-tier graduated structure', 'Crafted in antique gold-tone brass with brushed satin highlights', 'Accented with imitation rice pearls and round cut white zircons', 'Comfortable fabric back tie allows customized length', 'Comes with matching vintage Mughal jhumka earrings']::text[], array['haar', 'mughal', 'vintage', 'layered', 'traditional']::text[], false, false, true, now() - interval '7 minutes'),
  ('zj-ring-01', 'zarina-floral-zircon-cocktail-ring', 'Zarina Floral Zircon Cocktail Ring', 'rings', 1650, 2100, array['https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone with Crystal Zircons', 'Rose Gold-tone']::text[], array['6', '7', '8', 'Adjustable Free Size']::text[], 'A showstopping blossom of faceted cubic zirconia petals gathered around a sparkling center stone. Perfectly sized for festive flair.', array['High shine gold-tone plating over hypoallergenic metal', 'Prong-set premium marquise and round cubic zirconia stones', 'Available in fixed sizes or flexible adjustable comfort-band', 'Crown diameter: 22 mm', 'Smooth inner shank for all-day comfort']::text[], array['cocktail ring', 'statement', 'floral', 'zircon', 'party']::text[], true, true, true, now() - interval '8 minutes'),
  ('zj-ring-02', 'vintage-mughal-filigree-band', 'Vintage Mughal Filigree Band', 'rings', 1350, 1650, array['https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80']::text[], array['Antique Gold-tone', 'Warm Yellow Gold-tone']::text[], array['6', '7', '8', 'Adjustable Free Size']::text[], 'Delicate openwork filigree band featuring intricate arches and floral engravings reminiscent of historic Mughal architecture.', array['Laser-cut filigree scrollwork in durable alloy', 'Soft antique brushed gold-tone finish', 'Band width: 8 mm', 'Breathable, lightweight construction for daily wear', 'Non-snagging rounded edges']::text[], array['band', 'filigree', 'vintage', 'ethnic', 'stackable']::text[], false, true, true, now() - interval '9 minutes'),
  ('zj-ring-03', 'stackable-trio-gold-tone-rings', 'Stackable Trio Gold-Tone Rings', 'rings', 1850, 2200, array['https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone (Set of 3)', 'Mixed Metals (Gold, Rose, Silver-tone)']::text[], array['6', '7', '8', 'Adjustable Free Size']::text[], 'Set of three complementary rings: one micro-pave eternity band, one twisted rope band, and one solitaire chevron ring to wear together or separately.', array['Includes 3 distinct rings in one coordinated set', 'Micro-pave cubic zirconia crystals on the center band', 'Fine 1.5mm individual band thickness', 'Wear stacked together on one finger or spread across multiple', 'Resistant to tarnishing when kept dry']::text[], array['stackable', 'trio', 'minimal', 'modern', 'set']::text[], true, false, true, now() - interval '10 minutes'),
  ('zj-ring-04', 'emerald-tone-halo-solitaire-ring', 'Emerald-Tone Halo Solitaire Ring', 'rings', 1750, 2250, array['https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone with Emerald Green Stone', 'Silver-tone with Sapphire Blue Stone']::text[], array['6', '7', '8', 'Adjustable Free Size']::text[], 'An emerald-cut deep green synthetic gemstone framed by a radiant halo of brilliant round-cut clear cubic zirconia crystals.', array['Rich emerald-tone simulated crystal centerpiece (10x8 mm)', 'Surrounding halo of 24 micro-cut white cubic zirconia stones', 'Crafted in polished gold-tone metal alloy', 'Cathedral setting elevates the gemstone for maximum light dispersion', 'Available in fixed sizes or gently adjustable fit']::text[], array['halo', 'solitaire', 'emerald', 'statement', 'formal']::text[], false, false, true, now() - interval '11 minutes'),
  ('zj-brac-01', 'traditional-kundan-openable-kara', 'Traditional Kundan Openable Kara', 'bracelets', 2750, 3300, array['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone with Ruby & Green Accents', 'Gold-tone with White Stones']::text[], null, 'Heavy traditional bridal kara featuring intricate Meenakari enamel art on the inner rim and openable screw latch for easy wear.', array['Single openable statement kara (sold individually)', 'Traditional kundan stone setting with painted meenakari enamel work', 'Screw-lock hinge mechanism fits wrist sizes 2.4 to 2.8', 'High-grade brass base with heirloom antique gold-tone polish', 'Pairs seamlessly with festive Pakistani outfits']::text[], array['kara', 'kundan', 'bridal', 'bangle', 'meenakari']::text[], true, true, true, now() - interval '12 minutes'),
  ('zj-brac-02', 'sleek-cubic-zirconia-tennis-bracelet', 'Sleek Cubic Zirconia Tennis Bracelet', 'bracelets', 2250, 2800, array['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone', 'Silver-tone Rhodium Finish', 'Rose Gold-tone']::text[], null, 'A seamless strand of 3mm round-cut cubic zirconia stones. Offers timeless red-carpet brilliance with a double safety box clasp.', array['Continuous row of 3mm AAA-grade cubic zirconia crystals', 'Four-prong individual link basket setting for fluid flex', 'Double-latch safety clasp for secure wear', 'Length: 7.2 inches (18.5 cm)', 'Hypoallergenic coating prevents skin irritation']::text[], array['tennis bracelet', 'zircon', 'modern', 'luxury', 'evening']::text[], false, true, true, now() - interval '13 minutes'),
  ('zj-brac-03', 'textured-gold-tone-bangle-cuff', 'Textured Gold-Tone Bangle Cuff', 'bracelets', 1850, 2150, array['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone Hammered', 'Gold-tone Brushed Matt']::text[], null, 'A contemporary sculpted open cuff featuring hand-hammered light-catching facets. Adjusts gently by squeezing to fit your wrist perfectly.', array['Artisanal hammered texture with organic wavy edges', 'Malleable brass base allows subtle adjustment for any wrist', 'Width: 14 mm at widest point', 'Warm lustrous gold-tone finish', 'Looks striking worn alone or stacked alongside a watch']::text[], array['cuff', 'bangle', 'textured', 'contemporary', 'minimalist']::text[], true, false, true, now() - interval '14 minutes'),
  ('zj-brac-04', 'delicate-faux-pearl-charm-bracelet', 'Delicate Faux Pearl Charm Bracelet', 'bracelets', 1600, 1900, array['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=80']::text[], array['Gold-tone with White Pearls']::text[], null, 'Dainty paperclip chain bracelet adorned with mini lustrous imitation pearls and coin charms. A feminine staple for everyday poise.', array['Paperclip link chain in gold-tone polish', 'Alternating faux glass pearls and polished disk charms', 'Lobster claw clasp with 1.5-inch extender chain', 'Adjustable length: 6.5 to 8 inches', 'Lightweight and comfortable for daily wear']::text[], array['pearl', 'charm', 'chain', 'delicate', 'dainty']::text[], false, false, true, now() - interval '15 minutes')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 10. Backfills (after the seed, so seeded products are covered too)
-- ---------------------------------------------------------------------

-- Products created before sale prices existed: regular = old compare-at price when it was higher.
update public.products
   set regular_price = case when compare_at_price is not null and compare_at_price > price
                            then compare_at_price else price end,
       sale_price    = case when compare_at_price is not null and compare_at_price > price
                            then price end
 where regular_price is null;

alter table public.products alter column regular_price set not null;

-- One variant per colour x size (or a single "Default" variant) for products without variants.
-- Default stock is 10 per variant; change it in the admin or with an update after running this.
with combos as (
  select p.id as product_id,
         p.regular_price,
         p.sale_price,
         c.color,
         s.size,
         row_number() over (partition by p.id order by c.ord, s.ord) as n
    from public.products p
   cross join lateral unnest(case when cardinality(p.colors) > 0 then p.colors else array[''] end)
         with ordinality as c(color, ord)
   cross join lateral unnest(case when p.sizes is not null and cardinality(p.sizes) > 0 then p.sizes else array[''] end)
         with ordinality as s(size, ord)
   where not exists (select 1 from public.product_variants v where v.product_id = p.id)
)
insert into public.product_variants
  (id, product_id, sku, color, size, regular_price, sale_price, stock_qty, position)
select product_id || '-v' || n,
       product_id,
       upper(product_id) || '-' || lpad(n::text, 2, '0'),
       color,
       size,
       regular_price,
       sale_price,
       10,
       n
  from combos
on conflict do nothing;

-- Profile rows for accounts that already exist (for example the admin).
insert into public.profiles (id, full_name)
select u.id, left(coalesce(u.raw_user_meta_data ->> 'full_name', ''), 100)
  from auth.users u
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 11. Helper functions
-- ---------------------------------------------------------------------

-- jsonb array of strings -> text[] (anything else becomes an empty array).
create or replace function public.jsonb_text_array(j jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    array(select jsonb_array_elements_text(case when jsonb_typeof(j) = 'array' then j else '[]'::jsonb end)),
    '{}'::text[]);
$$;

-- A product row as the app's camelCase Product JSON (used for order snapshots).
create or replace function public.product_json(p public.products)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id',             p.id,
    'slug',           p.slug,
    'name',           p.name,
    'category',       p.category,
    'price',          p.price,
    'regularPrice',   p.regular_price,
    'salePrice',      p.sale_price,
    'compareAtPrice', p.compare_at_price,
    'images',         to_jsonb(p.images),
    'colors',         to_jsonb(p.colors),
    'sizes',          to_jsonb(p.sizes),
    'description',    p.description,
    'details',        to_jsonb(p.details),
    'tags',           to_jsonb(p.tags),
    'isNew',          p.is_new,
    'isBestSeller',   p.is_best_seller,
    'inStock',        p.in_stock
  ));
$$;


-- ---------------------------------------------------------------------
-- 12. Triggers
-- ---------------------------------------------------------------------

-- Keep products.rating_avg / rating_count equal to the approved reviews.
create or replace function public.reviews_rating_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text;
  v_new text;
  v_pid text;
begin
  if tg_op = 'DELETE' then
    v_old := old.product_id;
  elsif tg_op = 'INSERT' then
    v_new := new.product_id;
  else
    v_old := old.product_id;
    v_new := new.product_id;
  end if;

  for v_pid in
    select distinct x from unnest(array[v_old, v_new]) as x where x is not null
  loop
    update public.products p
       set rating_count = s.cnt,
           rating_avg   = s.avg_rating
      from (select count(*)::integer as cnt,
                   coalesce(round(avg(r.rating)::numeric, 2), 0) as avg_rating
              from public.reviews r
             where r.product_id = v_pid and r.status = 'approved') s
     where p.id = v_pid;
  end loop;
  return null;
end;
$$;

drop trigger if exists reviews_rating_sync_trg on public.reviews;
create trigger reviews_rating_sync_trg
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_rating_sync();

-- Create a profile row for every new account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.profiles_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_trg on public.profiles;
create trigger profiles_touch_trg
  before update on public.profiles
  for each row execute function public.profiles_touch();

-- Put an order's quantities back (p_sign = 1) or take them out again (p_sign = -1).
-- Items without a variantId (orders placed before variants existed) and variants that were
-- removed are skipped. Variants are locked in id order so two orders cannot deadlock.
create or replace function public.adjust_order_stock(p_items jsonb, p_sign integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then
    return;
  end if;

  for r in
    select i ->> 'variantId' as variant_id,
           sum((i ->> 'quantity')::integer) as qty
      from jsonb_array_elements(p_items) i
     where coalesce(i ->> 'variantId', '') <> ''
     group by 1
     order by 1
  loop
    if not exists (select 1 from public.product_variants v where v.id = r.variant_id) then
      continue;
    end if;

    if p_sign > 0 then
      update public.product_variants
         set stock_qty = stock_qty + r.qty
       where id = r.variant_id;
    else
      update public.product_variants
         set stock_qty = stock_qty - r.qty
       where id = r.variant_id and stock_qty >= r.qty;
      if not found then
        raise exception 'Not enough stock to reopen this order.';
      end if;
    end if;
  end loop;
end;
$$;

-- Cancelling restocks; reopening a cancelled order takes stock again; deleting an order that has
-- not shipped yet restocks (Dispatched and Delivered goods have left the shelf, so they do not).
create or replace function public.orders_restock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status in ('Pending Phone Confirmation', 'Confirmed') then
      perform public.adjust_order_stock(old.items, 1);
    end if;
    return old;
  end if;

  if new.status = 'Cancelled' then
    perform public.adjust_order_stock(new.items, 1);
  elsif old.status = 'Cancelled' then
    perform public.adjust_order_stock(new.items, -1);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_restock_update_trg on public.orders;
create trigger orders_restock_update_trg
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status)
  execute function public.orders_restock();

drop trigger if exists orders_restock_delete_trg on public.orders;
create trigger orders_restock_delete_trg
  before delete on public.orders
  for each row execute function public.orders_restock();


-- ---------------------------------------------------------------------
-- 13a. Coupons: work out the discount for a bag
--
-- p_lines: one entry per priced bag line, [{ "category": "rings", "amount": 3000, "onSale": false }]
--          where amount = unit price x quantity. Callers build it from the database, never the browser.
-- Unknown, disabled and malformed codes all give the same message so codes cannot be probed.
-- p_lock = true locks the coupon row (place_order) so two orders cannot both take the last use.
-- Returns { code, kind, value, discount, freeShipping }.
-- ---------------------------------------------------------------------

create or replace function public.coupon_discount(
  p_code  text,
  p_lines jsonb,
  p_phone text,
  p_uid   uuid,
  p_lock  boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_c    public.coupons;
  v_now  timestamptz := now();
  v_elig integer;
  v_disc integer;
  v_key  text;
  v_used integer;
begin
  if v_code !~ '^[A-Z0-9_-]{3,20}$' then
    raise exception 'This coupon code is not valid.';
  end if;

  if p_lock then
    select * into v_c from public.coupons c where c.code = v_code for update;
  else
    select * into v_c from public.coupons c where c.code = v_code;
  end if;

  if not found or not v_c.active then
    raise exception 'This coupon code is not valid.';
  end if;
  if v_c.starts_at is not null and v_now < v_c.starts_at then
    raise exception 'This coupon is not active yet.';
  end if;
  if v_c.expires_at is not null and v_now >= v_c.expires_at then
    raise exception 'This coupon has expired.';
  end if;

  -- Items the coupon applies to: right category, and not on sale unless the coupon allows it.
  select coalesce(sum((l ->> 'amount')::integer), 0)::integer
    into v_elig
    from jsonb_array_elements(p_lines) l
   where (cardinality(v_c.categories) = 0 or (l ->> 'category') = any (v_c.categories))
     and (v_c.include_sale_items or not coalesce((l ->> 'onSale')::boolean, false));

  if v_elig <= 0 then
    raise exception 'This coupon does not apply to the items in your bag.';
  end if;
  if v_elig < v_c.min_subtotal then
    raise exception 'Spend at least Rs. % on eligible items to use this coupon.', v_c.min_subtotal;
  end if;

  if v_c.usage_limit is not null then
    select count(*) into v_used
      from public.orders o
     where o.coupon_code = v_c.code and o.status <> 'Cancelled';
    if v_used >= v_c.usage_limit then
      raise exception 'This coupon has been fully used.';
    end if;
  end if;

  -- Once per customer: the same account, or the same phone number (last 10 digits; guests have no account).
  if v_c.once_per_customer then
    v_key := right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10);
    if exists (
      select 1
        from public.orders o
       where o.coupon_code = v_c.code
         and o.status <> 'Cancelled'
         and ((p_uid is not null and o.user_id = p_uid)
              or (length(v_key) = 10
                  and right(regexp_replace(coalesce(o.customer ->> 'phone', ''), '[^0-9]', '', 'g'), 10) = v_key))
    ) then
      raise exception 'You have already used this coupon.';
    end if;
  end if;

  v_disc := case v_c.kind
              when 'percent' then floor(v_elig * v_c.value / 100.0)::integer
              when 'fixed'   then least(v_c.value, v_elig)
              else 0
            end;

  return jsonb_build_object(
    'code',         v_c.code,
    'kind',         v_c.kind,
    'value',        v_c.value,
    'discount',     v_disc,
    'freeShipping', v_c.kind = 'free_shipping'
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 13b. Preview a coupon for the checkout page (no stock is touched)
--      Lines: [{ variantId, quantity }]. The phone number is not known yet, so the
--      once-per-customer check here uses the account only; place_order checks the phone too.
-- ---------------------------------------------------------------------

create or replace function public.validate_coupon(p_code text, p_lines jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line  jsonb;
  v_vid   text;
  v_qty   integer;
  v_var   public.product_variants;
  v_cat   text;
  v_items jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) not between 1 and 30 then
    raise exception 'Your bag is empty.';
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    if jsonb_typeof(v_line) is distinct from 'object' or coalesce(v_line ->> 'quantity', '') !~ '^[0-9]{1,2}$' then
      raise exception 'An item in your bag is invalid.';
    end if;
    v_qty := (v_line ->> 'quantity')::integer;
    if v_qty not between 1 and 20 then
      raise exception 'Quantity must be between 1 and 20 per item.';
    end if;

    v_vid := nullif(trim(coalesce(v_line ->> 'variantId', '')), '');
    select * into v_var from public.product_variants v where v.id = v_vid and v.active;
    if not found then
      raise exception 'An item in your bag is no longer available.';
    end if;

    select p.category into v_cat from public.products p where p.id = v_var.product_id;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'category', v_cat,
      'amount',   coalesce(v_var.sale_price, v_var.regular_price) * v_qty,
      'onSale',   v_var.sale_price is not null
    ));
  end loop;

  return public.coupon_discount(p_code, v_items, null, auth.uid(), false);
end;
$$;


-- ---------------------------------------------------------------------
-- 13c. Wishlist: merge a browser list into the account and return the full list
--      SECURITY INVOKER on purpose: Row Level Security keeps every customer to their own rows.
--      Unknown product ids are ignored, repeats are harmless, and at most 200 ids are accepted.
-- ---------------------------------------------------------------------

create or replace function public.wishlist_merge(p_ids text[])
returns text[]
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Please sign in to save your wishlist.';
  end if;
  if coalesce(cardinality(p_ids), 0) > 200 then
    raise exception 'Too many items in the wishlist.';
  end if;

  insert into public.wishlist_items (user_id, product_id)
  select v_uid, p.id
    from public.products p
   where p.id = any (coalesce(p_ids, '{}'::text[]))
  on conflict do nothing;

  return coalesce(
    array(select w.product_id from public.wishlist_items w where w.user_id = v_uid order by w.created_at, w.product_id),
    '{}'::text[]
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 13. Place an order (the only way a visitor can write to `orders`)
--
-- Prices, stock, shipping, the coupon discount and the order number are decided here,
-- never by the browser. SECURITY DEFINER runs as the table owner, so it can insert and
-- change stock even though visitors have no such rights on those tables.
-- Lines: [{ variantId, quantity }]  (the older { productId, color, size, quantity } also works)
-- p_coupon (optional): a coupon code; an invalid or used-up code stops the order with a message.
-- ---------------------------------------------------------------------

-- The two-argument version is replaced by the one below (p_coupon defaults to null, so old callers still work).
drop function if exists public.place_order(jsonb, jsonb);

create or replace function public.place_order(p_lines jsonb, p_customer jsonb, p_coupon text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  phone_re  constant text := '^(03|[+]923|923|00923)[0-9]{9}$';
  v_phone   text;
  v_wa      text;
  v_email   text;
  v_key     text;
  v_clean   jsonb;
  v_line    jsonb;
  v_norm    jsonb := '[]'::jsonb;
  v_ord     integer := 0;
  v_vid     text;
  v_pid     text;
  v_color   text;
  v_size    text;
  v_qty     integer;
  v_row     record;
  v_var     public.product_variants;
  v_prod    public.products;
  v_name    text;
  v_unit    integer;
  v_label   text;
  v_snap    jsonb;
  v_tmp     jsonb := '[]'::jsonb;
  v_items   jsonb;
  v_sub     integer := 0;
  v_cfg     jsonb;
  v_flat    integer;
  v_free    integer;
  v_ship    integer;
  v_elig    jsonb := '[]'::jsonb;
  v_cpn     jsonb;
  v_disc    integer := 0;
  v_num     text;
  v_now     timestamptz := now();
  v_uid     uuid := auth.uid();
begin
  -- ---- bag shape ----
  if jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception 'Your bag is empty.';
  end if;
  if jsonb_array_length(p_lines) not between 1 and 30 then
    raise exception 'Your bag must hold between 1 and 30 items.';
  end if;

  -- ---- customer details ----
  if jsonb_typeof(p_customer) is distinct from 'object' then
    raise exception 'Please fill in your delivery details.';
  end if;

  if length(trim(coalesce(p_customer ->> 'fullName', ''))) not between 3 and 100 then
    raise exception 'Please enter your full name.';
  end if;

  v_phone := regexp_replace(coalesce(p_customer ->> 'phone', ''), '[[:space:]()-]', '', 'g');
  if v_phone !~ phone_re then
    raise exception 'Please enter a valid Pakistani mobile number.';
  end if;

  v_wa := regexp_replace(coalesce(p_customer ->> 'whatsapp', ''), '[[:space:]()-]', '', 'g');
  if v_wa <> '' and v_wa !~ phone_re then
    raise exception 'Please enter a valid WhatsApp number or leave it blank.';
  end if;

  v_email := trim(coalesce(p_customer ->> 'email', ''));
  if v_email <> '' and (length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$') then
    raise exception 'Please enter a valid email address or leave it blank.';
  end if;

  if length(trim(coalesce(p_customer ->> 'province', ''))) not between 1 and 60 then
    raise exception 'Please select your province.';
  end if;
  if length(trim(coalesce(p_customer ->> 'city', ''))) not between 2 and 80 then
    raise exception 'Please enter your city.';
  end if;
  if length(trim(coalesce(p_customer ->> 'address', ''))) not between 10 and 500 then
    raise exception 'Please enter your complete delivery address.';
  end if;
  if length(coalesce(p_customer ->> 'notes', '')) > 500 then
    raise exception 'Order notes are too long.';
  end if;

  -- Abuse guard: max 5 orders per phone number per 10 minutes. Not real rate limiting
  -- (a bot can vary phone numbers); put Cloudflare / a WAF in front of the site for that.
  v_key := right(regexp_replace(v_phone, '[^0-9]', '', 'g'), 10);
  if (select count(*)
        from public.orders o
       where o.created_at > v_now - interval '10 minutes'
         and right(regexp_replace(coalesce(o.customer ->> 'phone', ''), '[^0-9]', '', 'g'), 10) = v_key) >= 5 then
    raise exception 'Too many orders from this number. Please wait a few minutes or contact us on WhatsApp.';
  end if;

  -- Keep only known fields (blocks mass assignment of extra keys).
  v_clean := jsonb_strip_nulls(jsonb_build_object(
    'fullName', trim(p_customer ->> 'fullName'),
    'phone',    trim(p_customer ->> 'phone'),
    'whatsapp', coalesce(nullif(trim(coalesce(p_customer ->> 'whatsapp', '')), ''), trim(p_customer ->> 'phone')),
    'email',    nullif(v_email, ''),
    'province', trim(p_customer ->> 'province'),
    'city',     trim(p_customer ->> 'city'),
    'address',  trim(p_customer ->> 'address'),
    'notes',    nullif(trim(coalesce(p_customer ->> 'notes', '')), '')
  ));

  -- ---- bag lines -> variant ids (remember the customer's order in "ord") ----
  for v_line in select * from jsonb_array_elements(p_lines) loop
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception 'An item in your bag is invalid.';
    end if;

    if coalesce(v_line ->> 'quantity', '') !~ '^[0-9]{1,2}$' then
      raise exception 'An item in your bag has an invalid quantity.';
    end if;
    v_qty := (v_line ->> 'quantity')::integer;
    if v_qty not between 1 and 20 then
      raise exception 'Quantity must be between 1 and 20 per item.';
    end if;

    v_vid := nullif(trim(coalesce(v_line ->> 'variantId', '')), '');
    if v_vid is null then
      -- Older lines: product + colour + size.
      v_pid   := coalesce(v_line ->> 'productId', '');
      v_color := coalesce(v_line ->> 'color', '');
      if v_color = 'Default' then
        v_color := '';
      end if;
      v_size := coalesce(v_line ->> 'size', '');

      select v.id into v_vid
        from public.product_variants v
       where v.product_id = v_pid and v.color = v_color and v.size = v_size and v.active
       limit 1;

      if v_vid is null and v_color = '' and v_size = '' then
        select v.id into v_vid
          from public.product_variants v
         where v.product_id = v_pid and v.active
         order by v.position, v.id
         limit 1;
      end if;

      if v_vid is null then
        raise exception 'An item in your bag is no longer available.';
      end if;
    end if;

    v_ord  := v_ord + 1;
    v_norm := v_norm || jsonb_build_array(jsonb_build_object('vid', v_vid, 'qty', v_qty, 'ord', v_ord));
  end loop;

  -- ---- take stock and price every variant. Rows are handled in variant-id order so two
  --      orders cannot deadlock; any failure below rolls back the whole order. ----
  for v_row in
    select n ->> 'vid' as vid,
           sum((n ->> 'qty')::integer)::integer as qty,
           min((n ->> 'ord')::integer) as ord
      from jsonb_array_elements(v_norm) n
     group by 1
     order by 1
  loop
    if v_row.qty > 20 then
      raise exception 'Quantity must be between 1 and 20 per item.';
    end if;

    update public.product_variants v
       set stock_qty = v.stock_qty - v_row.qty
     where v.id = v_row.vid and v.active and v.stock_qty >= v_row.qty
    returning v.* into v_var;

    if not found then
      select * into v_var from public.product_variants where id = v_row.vid;
      if not found or not v_var.active then
        raise exception 'An item in your bag is no longer available.';
      end if;
      select p.name into v_name from public.products p where p.id = v_var.product_id;
      if v_var.stock_qty <= 0 then
        raise exception '% is out of stock.', v_name;
      end if;
      raise exception 'Only % left of %.', v_var.stock_qty, v_name;
    end if;

    select * into v_prod from public.products where id = v_var.product_id;
    if not found or not v_prod.in_stock then
      raise exception '% is no longer available.', coalesce(v_prod.name, 'An item in your bag');
    end if;

    v_unit  := coalesce(v_var.sale_price, v_var.regular_price);
    v_label := coalesce(nullif(concat_ws(' / ', nullif(v_var.color, ''), nullif(v_var.size, '')), ''), 'Default');

    -- Product snapshot: the price is the variant's price, the first image is the variant's image.
    v_snap := (public.product_json(v_prod) - 'compareAtPrice' - 'images' - 'regularPrice' - 'salePrice')
      || jsonb_strip_nulls(jsonb_build_object(
           'price',          v_unit,
           'regularPrice',   v_var.regular_price,
           'salePrice',      v_var.sale_price,
           'compareAtPrice', case when v_var.sale_price is not null then v_var.regular_price end,
           'images',         to_jsonb(case when v_var.image_url is not null
                                           then array[v_var.image_url] || v_prod.images
                                           else v_prod.images end)
         ));

    v_tmp := v_tmp || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'ord',           v_row.ord,
      'cartItemId',    v_var.id,
      'variantId',     v_var.id,
      'sku',           v_var.sku,
      'variantLabel',  v_label,
      'unitPrice',     v_unit,
      'product',       v_snap,
      'quantity',      v_row.qty,
      'selectedColor', coalesce(nullif(v_var.color, ''), 'Default'),
      'selectedSize',  nullif(v_var.size, '')
    )));
    v_sub := v_sub + v_unit * v_row.qty;

    -- What a coupon needs to know about this line.
    v_elig := v_elig || jsonb_build_array(jsonb_build_object(
      'category', v_prod.category,
      'amount',   v_unit * v_row.qty,
      'onSale',   v_var.sale_price is not null
    ));
  end loop;

  -- Back to the order the customer had in their bag.
  select jsonb_agg(e - 'ord' order by (e ->> 'ord')::integer)
    into v_items
    from jsonb_array_elements(v_tmp) e;

  -- ---- shipping from the admin Settings tab (defaults match config/site.ts) ----
  select s.data into v_cfg from public.store_settings s limit 1;
  v_flat := coalesce(round((v_cfg ->> 'flatShippingRate')::numeric)::integer, 250);
  v_free := coalesce(round((v_cfg ->> 'freeShippingThreshold')::numeric)::integer, 3500);
  -- Free delivery is decided on the bag total before any coupon, so a coupon never removes it.
  v_ship := case when v_sub >= v_free then 0 else v_flat end;

  -- ---- coupon (an invalid code stops the whole order, nothing is silently skipped) ----
  if nullif(trim(coalesce(p_coupon, '')), '') is not null then
    v_cpn  := public.coupon_discount(p_coupon, v_elig, v_phone, v_uid, true);
    v_disc := (v_cpn ->> 'discount')::integer;
    if (v_cpn ->> 'freeShipping')::boolean then
      v_ship := 0;
    end if;
  end if;

  -- ---- save, retrying on the rare order-number collision ----
  loop
    v_num := 'ZJ-' || (100000 + floor(random() * 900000)::integer)::text;
    begin
      insert into public.orders (order_number, items, subtotal, discount, coupon_code, shipping, total, customer, created_at, user_id)
      values (v_num, v_items, v_sub, v_disc, v_cpn ->> 'code', v_ship, v_sub - v_disc + v_ship, v_clean, v_now, v_uid);
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  return jsonb_build_object(
    'orderNumber',   v_num,
    'items',         v_items,
    'subtotal',      v_sub,
    'discount',      v_disc,
    'couponCode',    v_cpn ->> 'code',
    'shipping',      v_ship,
    'total',         v_sub - v_disc + v_ship,
    'customer',      v_clean,
    'createdAt',     v_now,
    'paymentMethod', 'Cash on Delivery',
    'status',        'Pending Phone Confirmation'
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 14. Submit a review (held as "pending" until the admin approves it)
-- ---------------------------------------------------------------------

create or replace function public.submit_review(
  p_product_id text,
  p_rating     integer,
  p_author     text,
  p_title      text,
  p_body       text,
  p_hp         text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_author   text := trim(coalesce(p_author, ''));
  v_title    text := trim(coalesce(p_title, ''));
  v_body     text := trim(coalesce(p_body, ''));
  v_verified boolean := false;
begin
  -- Honeypot: real people leave this field empty. Pretend it worked.
  if coalesce(p_hp, '') <> '' then
    return;
  end if;

  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Please choose a star rating from 1 to 5.';
  end if;
  if length(v_author) not between 2 and 60 then
    raise exception 'Please enter your name.';
  end if;
  if length(v_title) > 100 then
    raise exception 'The review title is too long.';
  end if;
  if length(v_body) not between 10 and 2000 then
    raise exception 'Please write at least 10 characters in your review.';
  end if;

  if not exists (select 1 from public.products p where p.id = p_product_id) then
    raise exception 'This product is no longer available.';
  end if;

  -- Abuse guards (no identity to rate-limit on, so cap the moderation queue instead).
  if (select count(*) from public.reviews r where r.product_id = p_product_id and r.status = 'pending') >= 20 then
    raise exception 'This product has too many reviews waiting for approval. Please try again later.';
  end if;
  if (select count(*) from public.reviews r where r.status = 'pending') >= 200 then
    raise exception 'Reviews are temporarily paused. Please try again later.';
  end if;
  if exists (select 1 from public.reviews r
              where r.product_id = p_product_id
                and lower(r.author_name) = lower(v_author)
                and r.body = v_body) then
    raise exception 'You have already submitted this review.';
  end if;

  if v_uid is not null then
    if exists (select 1 from public.reviews r where r.product_id = p_product_id and r.user_id = v_uid) then
      raise exception 'You have already reviewed this product.';
    end if;
    -- Verified buyer: a non-cancelled order of this account contains the product.
    v_verified := exists (
      select 1
        from public.orders o
       where o.user_id = v_uid
         and o.status <> 'Cancelled'
         and o.items @> jsonb_build_array(jsonb_build_object('product', jsonb_build_object('id', p_product_id)))
    );
  end if;

  insert into public.reviews (product_id, user_id, rating, author_name, title, body, is_verified)
  values (p_product_id, v_uid, p_rating::smallint, v_author, v_title, v_body, v_verified);
end;
$$;


-- ---------------------------------------------------------------------
-- 14b. Contact Us: save a message for the admin to read
--      Visitors cannot read or write the table directly; this function is the only way in.
-- ---------------------------------------------------------------------

create or replace function public.submit_contact(
  p_name    text,
  p_phone   text,
  p_email   text,
  p_subject text,
  p_message text,
  p_hp      text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  phone_re  constant text := '^(03|[+]923|923|00923)[0-9]{9}$';
  v_name    text := trim(coalesce(p_name, ''));
  v_phone   text := regexp_replace(coalesce(p_phone, ''), '[[:space:]()-]', '', 'g');
  v_email   text := trim(coalesce(p_email, ''));
  v_subject text := trim(coalesce(p_subject, ''));
  v_message text := trim(coalesce(p_message, ''));
  v_key     text;
begin
  -- Honeypot: real people leave this field empty. Pretend it worked.
  if coalesce(p_hp, '') <> '' then
    return;
  end if;

  if length(v_name) not between 3 and 100 then
    raise exception 'Please enter your name.';
  end if;
  if v_phone !~ phone_re then
    raise exception 'Please enter a valid Pakistani phone number.';
  end if;
  if v_email <> '' and (length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$') then
    raise exception 'Please enter a valid email address or leave it blank.';
  end if;
  if length(v_subject) not between 3 and 150 then
    raise exception 'Please enter a subject.';
  end if;
  if length(v_message) not between 10 and 2000 then
    raise exception 'Your message must be between 10 and 2000 characters.';
  end if;

  -- Abuse guards. Not real rate limiting (a bot can vary phone numbers): put Cloudflare / a WAF in front for that.
  v_key := right(regexp_replace(v_phone, '[^0-9]', '', 'g'), 10);
  if (select count(*)
        from public.contact_messages c
       where c.created_at > now() - interval '1 hour'
         and right(regexp_replace(c.phone, '[^0-9]', '', 'g'), 10) = v_key) >= 3 then
    raise exception 'You have sent several messages already. Please wait a while or message us on WhatsApp.';
  end if;
  if exists (select 1
               from public.contact_messages c
              where c.created_at > now() - interval '1 day'
                and right(regexp_replace(c.phone, '[^0-9]', '', 'g'), 10) = v_key
                and lower(c.message) = lower(v_message)) then
    raise exception 'You have already sent this message.';
  end if;
  if (select count(*) from public.contact_messages c where c.status = 'new') >= 500 then
    raise exception 'Messages are temporarily paused. Please message us on WhatsApp instead.';
  end if;

  insert into public.contact_messages (full_name, phone, email, subject, message)
  values (v_name, v_phone, v_email, v_subject, v_message);
end;
$$;


-- ---------------------------------------------------------------------
-- 15. Save a product and its variants in one transaction (admin only)
--     SECURITY INVOKER on purpose: Row Level Security still applies, and the
--     is_admin() check below gives a clear error instead of a silent no-op.
--     Variants missing from p_variants are deactivated, never deleted.
-- ---------------------------------------------------------------------

create or replace function public.save_product(p_product jsonb, p_variants jsonb)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_id      text := nullif(trim(coalesce(p_product ->> 'id', '')), '');
  v_regular integer;
  v_sale    integer;
  v_var     jsonb;
  v_vid     text;
  v_vreg    integer;
  v_vsale   integer;
  v_ids     text[] := '{}';
  v_pos     integer := 0;
begin
  if not (select public.is_admin()) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_product) is distinct from 'object' then
    raise exception 'Missing product details.';
  end if;
  if jsonb_typeof(p_variants) is distinct from 'array' then
    raise exception 'A product needs at least one variant.';
  end if;
  if jsonb_array_length(p_variants) < 1 then
    raise exception 'A product needs at least one variant.';
  end if;
  if coalesce(trim(p_product ->> 'name'), '') = '' or coalesce(trim(p_product ->> 'slug'), '') = '' then
    raise exception 'A product needs a name and a slug.';
  end if;
  if coalesce(p_product ->> 'regularPrice', '') !~ '^[0-9]{1,9}$' then
    raise exception 'The regular price is required.';
  end if;

  v_regular := (p_product ->> 'regularPrice')::integer;
  v_sale    := nullif(p_product ->> 'salePrice', '')::integer;
  if v_sale is not null and v_sale >= v_regular then
    raise exception 'The sale price must be lower than the regular price.';
  end if;

  if v_id is null then
    v_id := 'zj-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  end if;

  insert into public.products
    (id, slug, name, category, price, regular_price, sale_price, short_description, description,
     details, tags, attributes, meta_title, meta_description, meta_keywords, og_image, images,
     is_new, is_best_seller, in_stock, updated_at)
  values
    (v_id,
     trim(p_product ->> 'slug'),
     trim(p_product ->> 'name'),
     p_product ->> 'category',
     coalesce(v_sale, v_regular),
     v_regular,
     v_sale,
     coalesce(p_product ->> 'shortDescription', ''),
     coalesce(p_product ->> 'description', ''),
     public.jsonb_text_array(p_product -> 'details'),
     public.jsonb_text_array(p_product -> 'tags'),
     case when jsonb_typeof(p_product -> 'attributes') = 'array' then p_product -> 'attributes' else '[]'::jsonb end,
     nullif(trim(coalesce(p_product ->> 'metaTitle', '')), ''),
     nullif(trim(coalesce(p_product ->> 'metaDescription', '')), ''),
     public.jsonb_text_array(p_product -> 'metaKeywords'),
     nullif(trim(coalesce(p_product ->> 'ogImage', '')), ''),
     public.jsonb_text_array(p_product -> 'images'),
     coalesce((p_product ->> 'isNew')::boolean, false),
     coalesce((p_product ->> 'isBestSeller')::boolean, false),
     coalesce((p_product ->> 'inStock')::boolean, true),
     now())
  on conflict (id) do update set
    slug              = excluded.slug,
    name              = excluded.name,
    category          = excluded.category,
    price             = excluded.price,
    regular_price     = excluded.regular_price,
    sale_price        = excluded.sale_price,
    short_description = excluded.short_description,
    description       = excluded.description,
    details           = excluded.details,
    tags              = excluded.tags,
    attributes        = excluded.attributes,
    meta_title        = excluded.meta_title,
    meta_description  = excluded.meta_description,
    meta_keywords     = excluded.meta_keywords,
    og_image          = excluded.og_image,
    images            = excluded.images,
    is_new            = excluded.is_new,
    is_best_seller    = excluded.is_best_seller,
    in_stock          = excluded.in_stock,
    updated_at        = now();

  for v_var in select * from jsonb_array_elements(p_variants) loop
    v_pos := v_pos + 1;

    if coalesce(v_var ->> 'regularPrice', '') !~ '^[0-9]{1,9}$' then
      raise exception 'Every variant needs a regular price.';
    end if;
    if coalesce(nullif(v_var ->> 'stockQty', ''), '0') !~ '^[0-9]{1,9}$' then
      raise exception 'Stock must be a whole number, 0 or more.';
    end if;
    v_vreg  := (v_var ->> 'regularPrice')::integer;
    v_vsale := nullif(v_var ->> 'salePrice', '')::integer;
    if v_vsale is not null and v_vsale >= v_vreg then
      raise exception 'A variant sale price must be lower than its regular price.';
    end if;

    v_vid := nullif(trim(coalesce(v_var ->> 'id', '')), '');

    if v_vid is not null then
      insert into public.product_variants
        (id, product_id, sku, color, size, regular_price, sale_price, stock_qty, image_url, position, active)
      values
        (v_vid, v_id,
         nullif(trim(coalesce(v_var ->> 'sku', '')), ''),
         trim(coalesce(v_var ->> 'color', '')),
         trim(coalesce(v_var ->> 'size', '')),
         v_vreg, v_vsale,
         coalesce(nullif(v_var ->> 'stockQty', '')::integer, 0),
         nullif(trim(coalesce(v_var ->> 'imageUrl', '')), ''),
         coalesce((v_var ->> 'position')::integer, v_pos),
         coalesce((v_var ->> 'active')::boolean, true))
      on conflict (id) do update set
        sku           = excluded.sku,
        color         = excluded.color,
        size          = excluded.size,
        regular_price = excluded.regular_price,
        sale_price    = excluded.sale_price,
        stock_qty     = excluded.stock_qty,
        image_url     = excluded.image_url,
        position      = excluded.position,
        active        = excluded.active
        where public.product_variants.product_id = v_id;
      if not found then
        raise exception 'A variant does not belong to this product.';
      end if;
    else
      insert into public.product_variants
        (id, product_id, sku, color, size, regular_price, sale_price, stock_qty, image_url, position, active)
      values
        (v_id || '-v' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), v_id,
         nullif(trim(coalesce(v_var ->> 'sku', '')), ''),
         trim(coalesce(v_var ->> 'color', '')),
         trim(coalesce(v_var ->> 'size', '')),
         v_vreg, v_vsale,
         coalesce(nullif(v_var ->> 'stockQty', '')::integer, 0),
         nullif(trim(coalesce(v_var ->> 'imageUrl', '')), ''),
         coalesce((v_var ->> 'position')::integer, v_pos),
         coalesce((v_var ->> 'active')::boolean, true))
      on conflict (product_id, color, size) do update set
        sku           = excluded.sku,
        regular_price = excluded.regular_price,
        sale_price    = excluded.sale_price,
        stock_qty     = excluded.stock_qty,
        image_url     = excluded.image_url,
        position      = excluded.position,
        active        = true
      returning id into v_vid;
    end if;

    v_ids := v_ids || v_vid;
  end loop;

  update public.product_variants
     set active = false
   where product_id = v_id and id <> all (v_ids);

  -- Keep the legacy colours / sizes lists equal to the active variants.
  update public.products
     set colors = coalesce((
           select array_agg(c.color order by c.pos)
             from (select v.color, min(v.position) as pos
                     from public.product_variants v
                    where v.product_id = v_id and v.active and v.color <> ''
                    group by v.color) c), '{}'::text[]),
         sizes = (
           select array_agg(z.size order by z.pos)
             from (select v.size, min(v.position) as pos
                     from public.product_variants v
                    where v.product_id = v_id and v.active and v.size <> ''
                    group by v.size) z)
   where id = v_id;

  return v_id;
end;
$$;


-- ---------------------------------------------------------------------
-- 16b. Variants follow the product price when it is changed outside save_product
--      (a direct SQL edit, an older admin). Variants with their own price keep it.
-- ---------------------------------------------------------------------

create or replace function public.products_cascade_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.product_variants v
     set regular_price = new.regular_price,
         sale_price    = new.sale_price
   where v.product_id = new.id
     and v.regular_price = old.regular_price
     and v.sale_price is not distinct from old.sale_price;
  return null;
end;
$$;

drop trigger if exists products_cascade_price_trg on public.products;
create trigger products_cascade_price_trg
  after update on public.products
  for each row
  when (old.regular_price is distinct from new.regular_price
        or old.sale_price is distinct from new.sale_price)
  execute function public.products_cascade_price();

revoke all on function public.products_cascade_price() from public, anon, authenticated;


-- ---------------------------------------------------------------------
-- 16. Row Level Security
-- ---------------------------------------------------------------------

alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.reviews          enable row level security;
alter table public.profiles         enable row level security;
alter table public.orders           enable row level security;
alter table public.coupons          enable row level security;
alter table public.wishlist_items   enable row level security;
alter table public.contact_messages enable row level security;
alter table public.store_settings   enable row level security;

-- products
drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select to anon, authenticated using (true);

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- product_variants
drop policy if exists variants_read on public.product_variants;
create policy variants_read on public.product_variants
  for select to anon, authenticated using (active or (select public.is_admin()));

drop policy if exists variants_admin_write on public.product_variants;
create policy variants_admin_write on public.product_variants
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- reviews (nobody inserts directly: submit_review() does it)
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select to anon, authenticated using (status = 'approved');

drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- profiles
drop policy if exists profiles_owner on public.profiles;
create policy profiles_owner on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles
  for select to authenticated using ((select public.is_admin()));

-- orders: no anon policy on purpose. Customers read their own, the admin manages all.
drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

-- coupons: admin only. Customers never read the table, so codes cannot be listed.
drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_admin_all on public.coupons
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- wishlist_items: a customer sees and changes only their own rows
drop policy if exists wishlist_owner on public.wishlist_items;
create policy wishlist_owner on public.wishlist_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- contact_messages: admin only (the messages contain phone numbers and emails)
drop policy if exists contact_admin_all on public.contact_messages;
create policy contact_admin_all on public.contact_messages
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- store_settings
drop policy if exists settings_read on public.store_settings;
create policy settings_read on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists settings_admin_write on public.store_settings;
create policy settings_admin_write on public.store_settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- ---------------------------------------------------------------------
-- 17. Grants (explicit; reset first because new Supabase tables may auto-grant)
-- ---------------------------------------------------------------------

revoke all on public.products, public.product_variants, public.reviews, public.profiles,
              public.orders, public.coupons, public.wishlist_items, public.contact_messages, public.store_settings
  from anon, authenticated;

grant select on public.products, public.product_variants, public.store_settings to anon, authenticated;
grant insert, update, delete on public.products, public.product_variants to authenticated;
grant insert, update on public.store_settings to authenticated;

-- Reviewer account ids (user_id) are never exposed: only the public columns can be selected.
grant select (id, product_id, rating, author_name, title, body, status, is_verified, created_at)
  on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;

grant select, insert, update on public.profiles to authenticated;

grant select, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.coupons to authenticated;
grant select, insert, delete on public.wishlist_items to authenticated;
grant select, update, delete on public.contact_messages to authenticated;

-- Functions. Supabase grants EXECUTE to anon/authenticated by default, so reset each one.
revoke all on function public.place_order(jsonb, jsonb, text)                        from public, anon, authenticated;
revoke all on function public.validate_coupon(text, jsonb)                           from public, anon, authenticated;
revoke all on function public.wishlist_merge(text[])                                 from public, anon, authenticated;
revoke all on function public.submit_contact(text, text, text, text, text, text)     from public, anon, authenticated;
revoke all on function public.coupon_discount(text, jsonb, text, uuid, boolean)      from public, anon, authenticated;
revoke all on function public.submit_review(text, integer, text, text, text, text)   from public, anon, authenticated;
revoke all on function public.save_product(jsonb, jsonb)                             from public, anon, authenticated;
revoke all on function public.product_json(public.products)                          from public, anon, authenticated;
revoke all on function public.adjust_order_stock(jsonb, integer)                     from public, anon, authenticated;
revoke all on function public.jsonb_text_array(jsonb)                                from public, anon;
revoke all on function public.products_price_sync()                                  from public, anon, authenticated;
revoke all on function public.reviews_rating_sync()                                  from public, anon, authenticated;
revoke all on function public.handle_new_user()                                      from public, anon, authenticated;
revoke all on function public.profiles_touch()                                       from public, anon, authenticated;
revoke all on function public.orders_restock()                                       from public, anon, authenticated;

grant execute on function public.place_order(jsonb, jsonb, text)                      to anon, authenticated;
grant execute on function public.validate_coupon(text, jsonb)                         to anon, authenticated;
grant execute on function public.wishlist_merge(text[])                               to authenticated;
grant execute on function public.submit_contact(text, text, text, text, text, text)   to anon, authenticated;
grant execute on function public.submit_review(text, integer, text, text, text, text) to anon, authenticated;
grant execute on function public.save_product(jsonb, jsonb)                           to authenticated;
grant execute on function public.jsonb_text_array(jsonb)                              to authenticated;
grant execute on function public.is_admin()                                           to anon, authenticated;


-- ---------------------------------------------------------------------
-- 18. Storage: product images (public to view, admin-only to change)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product-images admin select" on storage.objects;
create policy "product-images admin select" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product-images admin insert" on storage.objects;
create policy "product-images admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product-images admin update" on storage.objects;
create policy "product-images admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "product-images admin delete" on storage.objects;
create policy "product-images admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));


-- Make the API pick up the new tables and functions right away.
notify pgrst, 'reload schema';
