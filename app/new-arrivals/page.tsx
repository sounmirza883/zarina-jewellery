import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getNewArrivals } from '@/lib/api';
import ShopCatalog from '@/components/ShopCatalog';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `New Arrivals | ${siteConfig.name}`,
  description: 'Explore our latest releases in Pakistani artificial jewellery. Trend-forward designs, fresh gold-tone accents, and exquisite stones.',
};

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(16);

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-[#B8893B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs tracking-wider uppercase text-[#575757]">Loading New Arrivals...</p>
        </div>
      }
    >
      <ShopCatalog
        initialProducts={products}
        pageTitle="New Arrivals"
        pageSubtitle="Freshly introduced to our collection. Discover the newest statements in Kundan, Zircon, and heirloom-inspired jewellery."
      />
    </Suspense>
  );
}
