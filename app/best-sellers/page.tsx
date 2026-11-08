import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getBestSellers } from '@/lib/api';
import ShopCatalog from '@/components/ShopCatalog';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Best Sellers | ${siteConfig.name}`,
  description: 'Our most loved and reviewed artificial jewellery pieces across Pakistan. High demand bridal sets, chandbalis, and zircon bands.',
};

export default async function BestSellersPage() {
  const products = await getBestSellers(16);

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-[#B8893B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs tracking-wider uppercase text-[#575757]">Loading Best Sellers...</p>
        </div>
      }
    >
      <ShopCatalog
        initialProducts={products}
        pageTitle="Best Sellers"
        pageSubtitle="Celebrated by thousands of women across Lahore, Karachi, and Islamabad. The timeless designs that define Zarina Jewels."
      />
    </Suspense>
  );
}
