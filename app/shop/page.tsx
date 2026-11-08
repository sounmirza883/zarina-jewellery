import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getProducts } from '@/lib/api';
import ShopCatalog from '@/components/ShopCatalog';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Shop All Jewellery | ${siteConfig.name}`,
  description: 'Explore the complete collection of earrings, necklaces, rings, and bracelets. High-quality artificial jewellery with Cash on Delivery in Pakistan.',
};

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-[#B8893B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs tracking-wider uppercase text-[#575757]">Loading Collection...</p>
        </div>
      }
    >
      <ShopCatalog
        initialProducts={products}
        pageTitle="The Jewellery Collection"
        pageSubtitle="Artisanal craftsmanship, radiant zircons, and gold-tone finishes designed for weddings, Eid, and elevated daily wear."
      />
    </Suspense>
  );
}
