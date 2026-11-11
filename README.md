# Zarina Jewels - Artisanal Artificial Jewellery Storefront

A luxury, modern e-commerce web application built for **Zarina Jewels**, an artificial jewellery brand in Pakistan. Built with Next.js (App Router), TypeScript, Tailwind CSS, Zustand, and React Hook Form with Zod validation. Products, orders, store settings and admin login are stored in **Supabase** (see [Supabase setup](#-supabase-setup)).

## ✨ Brand Specifications
- **Brand Name**: Zarina Jewels (managed centrally in `/config/site.ts`)
- **Market**: Pakistan (Currency: PKR / Rs.)
- **Payment Method**: Strictly **Cash on Delivery (COD)** across all nationwide cities and towns
- **Brand Colors**:
  - Warm Ivory background: `#FAF7F2`
  - Charcoal typography: `#1F1F1F`
  - Deep Navy Black: `#0B0D12` (hero section, dark banners, and footer)
  - Soft Gold accent: `#B8893B`
  - Hover Gold: `#D9B66A`
- **Typography**: Cormorant Garamond (headings), Inter (body), Amiri (Arabic verse), Noto Nastaliq Urdu (Urdu translation)

---

## 🖼️ Recommended Image Dimensions
For optimal presentation and fast loading across mobile devices, use the following asset dimensions:
- **Product Images**: `1000 x 1250 px` (4:5 portrait ratio)
- **Hero Corner Banners**: `1600 x 900 px` (or `600 x 800 px` accent cards)
- **Category Tiles**: `800 x 800 px` (1:1 square or 3:4 portrait)
- **Brand & CEO Photos**: `800 x 1000 px` (4:5 portrait)

Image files should be placed inside `/public/images/products`, `/public/images/hero`, and `/public/images/brand`. If an image fails to load or is missing, the application automatically falls back to an elegant neutral beige placeholder (`<NeutralPlaceholder />`) with the brand monogram.

---

## 📁 Project Architecture & Folder Structure

```
├── app/
│   ├── about/page.tsx               # Brand story, mission, and CEO letter
│   ├── account/                     # Customer account: profile and order history (order PDF)
│   ├── wishlist/page.tsx            # Private wishlist page (saved pieces)
│   ├── auth/callback/route.ts       # Email confirmation and password-reset callback
│   ├── login/, signup/, forgot-password/, reset-password/   # Customer sign-in pages
│   ├── best-sellers/page.tsx        # Customer favorites catalog
│   ├── cart/page.tsx                # Dedicated bag page with line items & totals
│   ├── category/[slug]/page.tsx     # Filtered by category (earrings, necklaces, etc.)
│   ├── checkout/page.tsx            # Guest checkout form with Pakistani phone validation
│   ├── contact/page.tsx             # Contact form & WhatsApp / store details
│   ├── globals.css                  # Tailwind styles and theme tokens
│   ├── layout.tsx                   # Root layout with fonts, header, footer, cart drawer
│   ├── new-arrivals/page.tsx        # Newest releases catalog
│   ├── not-found.tsx                # Custom 404 page
│   ├── order-success/page.tsx       # Order confirmation & WhatsApp verify prompt
│   ├── page.tsx                     # Home page (Hero, Verse, Collections, Trust, Story)
│   ├── policies/                    # Returns, Delivery, Privacy, Terms
│   ├── product/[slug]/page.tsx      # Product detail page with gallery & JSON-LD schema
│   ├── actions/revalidate.ts        # Admin-only server action: refreshes static pages after edits
│   ├── robots.ts                    # Search crawler rules
│   ├── sitemap.ts                   # Dynamic XML sitemap
│   └── shop/page.tsx                # Shop all catalogue with search, sort, and price filters
├── components/
│   ├── admin/                       # Product editor, variants, image upload, reviews tab, coupons tab
│   ├── OrderSlip.tsx, OrderPdfButton.tsx   # Customer order PDF and admin COD dispatch slip PDF
│   ├── ReviewsSection.tsx, StarRating.tsx  # Reviews list, submit form and stars
│   ├── BrandStoryBlock.tsx          # Home page brand narrative
│   ├── CartDrawer.tsx               # Slide-out shopping bag drawer
│   ├── CategoryTiles.tsx            # 4 category cards
│   ├── ContactFormClient.tsx        # Validated contact form
│   ├── FloatingWhatsApp.tsx         # Persistent WhatsApp button
│   ├── Footer.tsx                   # Luxury navy footer
│   ├── Header.tsx                   # Top announcement, logo, search, and navigation
│   ├── Hero.tsx                     # Deep navy hero with live Arabic & Urdu verse
│   ├── ProductCard.tsx              # Reusable product card with quick add
│   ├── ProductDetailClient.tsx      # Gallery, selectors, qty, and WhatsApp link
│   ├── ProductImage.tsx             # Next.js image with beige placeholder fallback
│   ├── SettingsHydrator.tsx         # Passes admin shipping rules from the server to the cart
│   ├── ShopCatalog.tsx              # Interactive catalog with filters & sorting
│   ├── ToastNotification.tsx        # Real-time feedback for cart updates
│   └── TrustStrip.tsx               # 4-pillar customer trust row
├── config/
│   └── site.ts                      # Central brand configuration, contact, shipping rates
├── constants/
│   └── verse.ts                     # Surah As-Sajdah 32:7 live Arabic & Urdu text
├── data/
│   └── products.ts                  # Mock products with materials & category definitions
├── lib/
│   ├── api.ts                       # Server-side reads of products & settings (Supabase, static fallback)
│   ├── admin-store.ts               # Admin dashboard calls (login, orders, products, settings)
│   ├── settings.ts                  # Admin settings type and defaults (shipping, announcement)
│   ├── supabase/                    # Supabase clients (browser, server, public), env check, row mappers
│   ├── pricing.ts                   # Selling/regular/sale price, variants, stock helpers (pure)
│   ├── shop-logic.ts                # Cart maths, shipping calculations, PK phone validation
│   ├── account.ts, order-pdf.ts, seo.ts, reviews-api.ts, coupons.ts, coupon-form.ts, wishlist.ts, wishlist-api.ts, resend.ts, order-email.ts   # Accounts, PDFs, JSON-LD, reviews, coupons, wishlist, order emails
│   └── *.test.ts                    # Node built-in unit tests (node:test)
├── middleware.ts                    # Refreshes the Supabase session on /admin and guards /account
├── supabase/
│   └── schema.sql                   # THE one SQL file: tables, RLS, RPCs, triggers, storage, seed data
├── store/
│   └── cart.ts                      # Persistent Zustand store synced to localStorage
└── types/
    └── product.ts                   # Strong TypeScript definitions
```

---

## 🛠️ How to Edit Products and Configuration

### 1. Changing Brand Details or Shipping Rates
Open `/config/site.ts`:
- Change brand name: edit `siteConfig.name`
- Adjust shipping rate: edit `siteConfig.shipping.flatRate` (default: 250 PKR)
- Adjust free shipping threshold: edit `siteConfig.shipping.freeShippingThreshold` (default: 3500 PKR)
- Update contact details or WhatsApp link: edit `siteConfig.contact`

### 2. Adding or Editing Products
Use the admin panel (`/admin` -> Catalogue & Inventory -> Add Product). Each product has:
- **General**: name, URL slug, category, new / best-seller / listed switches, short description, long description, highlight bullets, tags
- **Pricing**: regular price, optional sale price (the selling price is the sale price when set, otherwise the regular price)
- **Variants**: colour and size combinations, each with its own SKU, regular/sale price, stock quantity, image and active switch
- **Images**: upload several photos (stored in the Supabase `product-images` bucket)
- **Attributes**: name/value specs such as Material or Finish
- **SEO**: meta title, meta description, meta keywords and the social-share image

Stock goes down automatically when an order is placed and comes back if the order is cancelled. `/data/products.ts` is only the offline fallback used when Supabase is not configured.

*Content Rule Reminder*: All artificial jewellery items must specify simulated materials such as **gold-tone, zircon, cubic zirconia, or glass kundan**. Never use claims of solid gold or natural diamonds.

---

## 🔌 Supabase setup
Products (with variants and stock), reviews, coupons, wishlists, customer accounts, orders, store settings and admin login all live in Supabase. Storefront pages read through `/lib/api.ts`. **Everything in the database comes from one file: `supabase/schema.sql`.**
1. Create a project at [supabase.com](https://supabase.com).
2. **Run the SQL first, before deploying this code.** Open **SQL Editor**, paste `supabase/schema.sql` and run it. It is safe to run again and never deletes existing data.
3. Create your admin user in **Authentication -> Users**, then run the `update auth.users ... '{"role":"admin"}'` statement from the header of `supabase/schema.sql`.
4. Keep **Authentication -> Providers -> Email -> "Allow new users to sign up"** ON: customers create accounts. Admin access depends only on the `admin` role set in step 3, which customers cannot set.
5. **Authentication -> URL Configuration**: set the Site URL to your website and add `<your site>/auth/callback` to the Redirect URLs (used by email confirmation and password reset).
6. Before real customers sign up, connect your own email provider under **Authentication -> Emails -> SMTP**; Supabase's built-in sender allows only a few emails per hour.
7. Copy the Project URL and the anon / publishable key (never `service_role`) from **Project Settings -> API** into `.env` (see `.env.example`), then restart the dev server.
8. Install with `npm ci` (see [Getting started](#-getting-started-fresh-clone-and-teamwork)); `package-lock.json` is the only lockfile.

Without the env vars the storefront falls back to the static products in `/data/products.ts`. Checkout, accounts, reviews and the admin dashboard need Supabase.

**Order PDFs**: after checkout the customer can download an order PDF. In the admin order window you can download the COD dispatch slip as a PDF or print it.

**Coupons**: in the admin **Coupons** tab create a code (percentage off, fixed amount off, or free delivery) and choose which categories it works on (all, or ticked ones), a minimum spend, whether it also applies to items already on sale, start and expiry dates, a total number of uses and once per customer (by phone number or account). Customers type the code in the box at checkout. The discount is worked out inside `place_order`, so the browser cannot change it; a cancelled order gives its coupon use back. Delivery stays free above the free-shipping amount even when a coupon is used. Run the updated `supabase/schema.sql` before deploying this code.

**Wishlist**: customers tap the heart on a product card or product page to save a piece; the header heart shows the count and `/wishlist` lists the saved pieces. The list is kept in the browser (works without an account). When a customer signs in, their browser list is merged into their account (`wishlist_items` table, `wishlist_merge()` function in `supabase/schema.sql`) and loaded on their other devices; signing out clears a list that came from an account. Run the updated `supabase/schema.sql` for the account sync; the browser wishlist works without it.

**Order emails (Resend)**: when an order is placed, checkout sends it through the server action `app/actions/place-order.ts`, which saves it with `place_order` exactly as before and then emails (through [Resend](https://resend.com), `lib/resend.ts`) a confirmation to the customer (only if they typed an email at checkout) and a "new order" alert to the shop owner (`lib/order-email.ts`). The emails go out after the response, so checkout is not slowed down, and an email problem never cancels or hides an order; failures are only written to the server log. Set these **server** variables (none start with `NEXT_PUBLIC_`; see `.env.example`):

| Variable | Example | Purpose |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | Resend API key (create it with "Sending access" only) |
| `ORDER_EMAIL_FROM` | `Zarina Jewels <orders@zarinajewels.pk>` | Sender, must be on a domain verified in Resend |
| `ORDER_NOTIFY_EMAIL` | `owner@gmail.com` | Gets the new-order alert and any customer reply; separate several addresses with commas |

Setup: in Resend add your domain (a subdomain such as `updates.zarinajewels.pk` is recommended) and add the DNS records it shows (usually verified within minutes, up to 72 hours); create the API key; add the three variables in Vercel (**Settings -> Environment Variables**) and **redeploy**, because variables only reach new deployments; then place one test order with your own email. Without the variables the shop works as before and just logs that emails are switched off. Resend can only send to other people from a verified domain; its shared test sender `onboarding@resend.dev` delivers only to your own Resend account email. Limits: the Resend free plan allows 100 emails a day and 3,000 a month (an order with an email uses 2); there is no retry, so an email is lost if Resend is down at that moment; a guest can type someone else's address and that person gets one confirmation (the email says how to report it); emails are English only and only sent when an order is placed, not when its status changes.

**Known limits**: coupon checks and review submissions have no per-IP rate limiting (put Cloudflare or a similar service in front for production); there are no SMS or WhatsApp notifications, and emails are sent only when an order is placed.

---

## 🚀 Getting started, fresh clone and teamwork
Needs **Node 20 or newer** and **Git**. Use **npm** only: `package-lock.json` is the one lockfile, and `bun install` / `yarn` create extra lockfiles that dirty the working tree. Keep the project **outside OneDrive** (for example `C:\dev`): OneDrive locks files and half-syncs `.git`, which causes random Git errors.

**First time, or when the owner says "delete it and clone again"**: paste this block into PowerShell from any folder. It refuses to delete a copy that has uncommitted, stashed or unpushed work, keeps your `.env`, clones again, installs and starts the site on <http://localhost:3000>.

```powershell
& {
  $dir = "C:\dev\zarina-jewellery"   # where the project lives (outside OneDrive)
  $url = "https://github.com/sounmirza883/zarina-jewellery.git"
  $bak = "$env:TEMP\zarina.env"
  Remove-Item $bak -ErrorAction SilentlyContinue
  if (Test-Path "$dir\.git") {
    if (git -C $dir status --porcelain)                      { throw "Uncommitted changes in $dir. Commit or stash them first." }
    if (git -C $dir stash list)                              { throw "Stashed work in $dir. Apply or drop it first." }
    if (git -C $dir log --branches --not --remotes --oneline) { throw "Unpushed commits in $dir. Run git push first." }
    if (Test-Path "$dir\.env") { Copy-Item "$dir\.env" $bak }
  }
  Set-Location $env:USERPROFILE   # step out of the folder so it can be deleted
  if (Test-Path $dir) { cmd /c rmdir /s /q "$dir" }
  git clone $url $dir;                    if ($LASTEXITCODE) { throw "git clone failed" }
  Set-Location $dir
  if (Test-Path $bak) { Move-Item $bak .env } else { Copy-Item .env.example .env }
  npm ci;                                 if ($LASTEXITCODE) { throw "npm ci failed" }
  npm run dev
}
```

**`.env`**: ask the owner for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and paste them into `.env` to see the real products and orders. Without them the site still runs on the static demo products in `/data/products.ts`. You do not need `RESEND_API_KEY`; never commit `.env`.

**Daily flow**:
```bash
git pull                              # always first
git checkout -b feat/short-name       # one branch per piece of work
git add -A && git commit -m "feat: what changed"
git push -u origin HEAD               # first push of a branch; afterwards just: git push
```
Every commit and branch pushed to GitHub shows up for the owner after a `git fetch`; nothing else to set up. If `git pull` says "Please clean your repository working tree before checkout", run `git status`, commit or `git stash` your changes, then pull again.

---

## 🧪 Testing and Verification
Unit tests are written with Node's native test runner (`node:test`) and verify:
- PKR currency formatting (`formatPKR`)
- Flat rate and free shipping threshold calculations
- Strict Pakistani mobile phone number validation (`03001234567`, `0300-1234567`, `+923001234567`)
- Price, variant and stock helpers, row mappers, product-form validation, review validation, coupon rules and totals, wishlist rules and store, order emails (content, HTML escaping, recipients) and the Resend request, JSON-LD and redirect safety

Run the tests using:
```bash
npx --yes tsx --test lib/*.test.ts lib/supabase/*.test.ts
```
The SQL in `supabase/schema.sql` cannot be unit tested here; run it on a Supabase project and place a test order and a review.
