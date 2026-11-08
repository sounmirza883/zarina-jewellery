# Zarina Jewels - Artisanal Artificial Jewellery Storefront

A luxury, modern frontend-only e-commerce web application built for **Zarina Jewels**, an artificial jewellery brand in Pakistan. Built with Next.js (App Router), TypeScript, Tailwind CSS, Zustand, and React Hook Form with Zod validation.

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
│   ├── robots.ts                    # Search crawler rules
│   ├── sitemap.ts                   # Dynamic XML sitemap
│   └── shop/page.tsx                # Shop all catalogue with search, sort, and price filters
├── components/
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
│   ├── ShopCatalog.tsx              # Interactive catalog with filters & sorting
│   ├── ToastNotification.tsx        # Real-time feedback for cart updates
│   └── TrustStrip.tsx               # 4-pillar customer trust row
├── config/
│   └── site.ts                      # Central brand configuration, contact, shipping rates
├── constants/
│   └── verse.ts                     # Surah Al-A'raf 7:31 live Arabic & Urdu text
├── data/
│   └── products.ts                  # Mock products with materials & category definitions
├── lib/
│   ├── api.ts                       # Abstracted API layer for products & categories
│   ├── shop-logic.ts                # Pure math, shipping calculations, PK phone validation
│   └── shop-logic.test.ts           # Node built-in unit tests (node:test)
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
Open `/data/products.ts`:
Each product requires:
```typescript
{
  id: 'zj-unique-id',
  slug: 'product-slug-url',
  name: 'Product Name',
  category: 'earrings' | 'necklaces' | 'rings' | 'bracelets',
  price: 2450,
  compareAtPrice: 2950,
  images: ['/images/products/photo1.jpg', '/images/products/photo2.jpg'],
  colors: ['Gold-tone', 'Silver-tone'],
  sizes: ['6', '7', '8'], // Optional (for rings)
  description: 'Short, clear product description',
  details: ['Gold-tone finish', 'AAA cubic zirconia'],
  tags: ['kundan', 'bridal'],
  isNew: true,
  isBestSeller: false,
  inStock: true,
}
```
*Content Rule Reminder*: All artificial jewellery items must specify simulated materials such as **gold-tone, zircon, cubic zirconia, or glass kundan**. Never use claims of solid gold or natural diamonds.

---

## 🔌 Replacing the Data Layer with a Real API
All pages and components interact with products **exclusively** through `/lib/api.ts`.
To connect to a live backend (such as WooCommerce, Shopify Headless, MedusaJS, or a custom REST / GraphQL API):
1. Open `/lib/api.ts`.
2. Replace the internal array lookups with standard `fetch('https://api.yourdomain.com/products')` calls inside `getProducts()`, `getProductBySlug()`, `getProductsByCategory()`, and `searchProducts()`.
3. Return data mapped to the `Product` interface in `/types/product.ts`.
4. **None of your pages, components, or UI code need to be modified** because they already consume the abstracted Promise-based API functions.

---

## 🧪 Testing and Verification
Unit tests are written with Node's native test runner (`node:test`) and verify:
- PKR currency formatting (`formatPKR`)
- Flat rate and free shipping threshold calculations
- Strict Pakistani mobile phone number validation (`03001234567`, `0300-1234567`, `+923001234567`)
- Unique order number generation (`ZJ-XXXXX`)

Run the tests using:
```bash
npx --yes tsx --test lib/shop-logic.test.ts
```
