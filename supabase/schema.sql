-- =====================================================================
-- Zarina Jewels: Supabase schema, Row Level Security, order RPC, seed data
--
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run (it never
-- overwrites products or settings that already exist).
--
-- After running:
--   1. Authentication -> Users -> add your admin user (email + password).
--   2. Make that user an admin. Only the dashboard/SQL can set app_metadata,
--      so a customer can never grant it to themselves:
--        update auth.users
--           set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--         where email = 'you@example.com';
--   3. Authentication -> Providers -> Email: turn OFF "Allow new users to sign up".
--
-- Access model
--   products        public read, admin write
--   store_settings  public read, admin write
--   orders          NO direct access for visitors. They place orders through
--                   public.place_order(), which re-prices the bag on the server.
--                   Only the admin can read, update or delete orders.
--
-- Checkout call from the app:
--   supabase.rpc('place_order', {
--     p_lines:    [{ productId, quantity, color, size }],
--     p_customer: { fullName, phone, whatsapp, email, province, city, address, notes },
--   })
--   -> returns the saved order in the app's Order shape (camelCase JSON).
-- Use the anon / publishable key in the browser. Never ship the service_role key.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Tables
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
  created_at     timestamptz not null default now(),
  check (total = subtotal + shipping)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- One row only (id is forced to true). `data` holds the admin Settings tab values.
create table if not exists public.store_settings (
  id   boolean primary key default true check (id),
  data jsonb not null default '{}'::jsonb
);


-- ---------------------------------------------------------------------
-- Helpers
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
-- Place an order (the only way a visitor can write to `orders`)
--
-- Prices, shipping and the order number are computed here, never trusted from
-- the browser. SECURITY DEFINER runs as the table owner, so it can insert
-- even though visitors have no INSERT right on public.orders.
-- ---------------------------------------------------------------------

create or replace function public.place_order(p_lines jsonb, p_customer jsonb)
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
  v_prod    public.products;
  v_qty     integer;
  v_color   text;
  v_size    text;
  v_items   jsonb := '[]'::jsonb;
  v_sub     integer := 0;
  v_cfg     jsonb;
  v_flat    integer;
  v_free    integer;
  v_ship    integer;
  v_num     text;
  v_now     timestamptz := now();
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

  if length(trim(coalesce(p_customer->>'fullName', ''))) not between 3 and 100 then
    raise exception 'Please enter your full name.';
  end if;

  v_phone := regexp_replace(coalesce(p_customer->>'phone', ''), '[[:space:]()-]', '', 'g');
  if v_phone !~ phone_re then
    raise exception 'Please enter a valid Pakistani mobile number.';
  end if;

  v_wa := regexp_replace(coalesce(p_customer->>'whatsapp', ''), '[[:space:]()-]', '', 'g');
  if v_wa <> '' and v_wa !~ phone_re then
    raise exception 'Please enter a valid WhatsApp number or leave it blank.';
  end if;

  v_email := trim(coalesce(p_customer->>'email', ''));
  if v_email <> '' and (length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$') then
    raise exception 'Please enter a valid email address or leave it blank.';
  end if;

  if length(trim(coalesce(p_customer->>'province', ''))) not between 1 and 60 then
    raise exception 'Please select your province.';
  end if;
  if length(trim(coalesce(p_customer->>'city', ''))) not between 2 and 80 then
    raise exception 'Please enter your city.';
  end if;
  if length(trim(coalesce(p_customer->>'address', ''))) not between 10 and 500 then
    raise exception 'Please enter your complete delivery address.';
  end if;
  if length(coalesce(p_customer->>'notes', '')) > 500 then
    raise exception 'Order notes are too long.';
  end if;

  -- Abuse guard: max 5 orders per phone number per 10 minutes. This is not
  -- real rate limiting (a bot can vary phone numbers); put Cloudflare / a WAF
  -- in front of the site for that.
  v_key := right(regexp_replace(v_phone, '[^0-9]', '', 'g'), 10);
  if (select count(*)
        from public.orders o
       where o.created_at > v_now - interval '10 minutes'
         and right(regexp_replace(coalesce(o.customer->>'phone', ''), '[^0-9]', '', 'g'), 10) = v_key) >= 5 then
    raise exception 'Too many orders from this number. Please wait a few minutes or contact us on WhatsApp.';
  end if;

  -- Keep only known fields (blocks mass assignment of extra keys).
  v_clean := jsonb_strip_nulls(jsonb_build_object(
    'fullName', trim(p_customer->>'fullName'),
    'phone',    trim(p_customer->>'phone'),
    'whatsapp', coalesce(nullif(trim(coalesce(p_customer->>'whatsapp', '')), ''), trim(p_customer->>'phone')),
    'email',    nullif(v_email, ''),
    'province', trim(p_customer->>'province'),
    'city',     trim(p_customer->>'city'),
    'address',  trim(p_customer->>'address'),
    'notes',    nullif(trim(coalesce(p_customer->>'notes', '')), '')
  ));

  -- ---- bag lines: re-price every line from the products table ----
  for v_line in select * from jsonb_array_elements(p_lines) loop
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception 'An item in your bag is invalid.';
    end if;

    if coalesce(v_line->>'quantity', '') !~ '^[0-9]{1,2}$' then
      raise exception 'An item in your bag has an invalid quantity.';
    end if;
    v_qty := (v_line->>'quantity')::integer;
    if v_qty not between 1 and 20 then
      raise exception 'Quantity must be between 1 and 20 per item.';
    end if;

    select * into v_prod from public.products where id = v_line->>'productId';
    if not found then
      raise exception 'An item in your bag is no longer available.';
    end if;
    if not v_prod.in_stock then
      raise exception '% is out of stock.', v_prod.name;
    end if;

    if cardinality(v_prod.colors) > 0 then
      v_color := coalesce(nullif(v_line->>'color', ''), v_prod.colors[1]);
      if not (v_color = any (v_prod.colors)) then
        raise exception 'The selected colour for % is not available.', v_prod.name;
      end if;
    else
      v_color := 'Default';
    end if;

    if v_prod.sizes is not null and cardinality(v_prod.sizes) > 0 then
      v_size := coalesce(nullif(v_line->>'size', ''), v_prod.sizes[1]);
      if not (v_size = any (v_prod.sizes)) then
        raise exception 'The selected size for % is not available.', v_prod.name;
      end if;
    else
      v_size := null;
    end if;

    v_items := v_items || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'cartItemId',    v_prod.id || '__' || v_color || '__' || coalesce(v_size, 'default'),
      'product',       public.product_json(v_prod),
      'quantity',      v_qty,
      'selectedColor', v_color,
      'selectedSize',  v_size
    )));
    v_sub := v_sub + v_prod.price * v_qty;
  end loop;

  -- ---- shipping from the admin Settings tab (defaults match config/site.ts) ----
  select s.data into v_cfg from public.store_settings s limit 1;
  v_flat := coalesce(round((v_cfg->>'flatShippingRate')::numeric)::integer, 250);
  v_free := coalesce(round((v_cfg->>'freeShippingThreshold')::numeric)::integer, 3500);
  v_ship := case when v_sub >= v_free then 0 else v_flat end;

  -- ---- save, retrying on the rare order-number collision ----
  loop
    v_num := 'ZJ-' || (100000 + floor(random() * 900000)::integer)::text;
    begin
      insert into public.orders (order_number, items, subtotal, shipping, total, customer, created_at)
      values (v_num, v_items, v_sub, v_ship, v_sub + v_ship, v_clean, v_now);
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  return jsonb_build_object(
    'orderNumber',   v_num,
    'items',         v_items,
    'subtotal',      v_sub,
    'shipping',      v_ship,
    'total',         v_sub + v_ship,
    'customer',      v_clean,
    'createdAt',     v_now,
    'paymentMethod', 'Cash on Delivery',
    'status',        'Pending Phone Confirmation'
  );
end;
$$;


-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select to anon, authenticated using (true);

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists settings_read on public.store_settings;
create policy settings_read on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists settings_admin_write on public.store_settings;
create policy settings_admin_write on public.store_settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- No anon policy on orders on purpose: visitors cannot read or write it directly.
drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- ---------------------------------------------------------------------
-- Grants (explicit, so this works whether or not the project auto-grants)
-- ---------------------------------------------------------------------

grant select on public.products, public.store_settings to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert, update on public.store_settings to authenticated;
grant select, update, delete on public.orders to authenticated;

grant execute on function public.is_admin() to anon, authenticated;

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

revoke all on function public.product_json(public.products) from public;


-- ---------------------------------------------------------------------
-- Seed data (from data/products.ts). Existing rows are left untouched.
-- ---------------------------------------------------------------------

insert into public.store_settings (id, data)
values (true, '{"flatShippingRate": 250, "freeShippingThreshold": 3500}'::jsonb)
on conflict (id) do nothing;

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
