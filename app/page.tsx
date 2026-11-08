import Link from 'next/link';
import { ArrowRight, Sparkles, Flame } from 'lucide-react';
import Hero from '@/components/Hero';
import CategoryTiles from '@/components/CategoryTiles';
import TrustStrip from '@/components/TrustStrip';
import BrandStoryBlock from '@/components/BrandStoryBlock';
import ProductCard from '@/components/ProductCard';
import { getNewArrivals, getBestSellers } from '@/lib/api';

export default async function HomePage() {
  const newArrivals = await getNewArrivals(4);
  const bestSellers = await getBestSellers(4);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section with Live Arabic & Urdu Verse */}
      <Hero />

      {/* 2. Curated Category Tiles */}
      <CategoryTiles />

      {/* 3. New Arrivals Section */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#B8893B]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#FAF7F2]">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B8893B] font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fresh in Store</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/new-arrivals"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#0B0D12] hover:text-[#B8893B] transition-colors"
            >
              <span>View All New Pieces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Trust Strip */}
      <TrustStrip />

      {/* 5. Best Sellers Section */}
      <section className="py-16 sm:py-20 bg-[#FAF7F2] border-b border-[#B8893B]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#E8DDD0]">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B8893B] font-semibold mb-2">
                <Flame className="w-3.5 h-3.5" />
                <span>Customer Favorites</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
                Best Sellers
              </h2>
            </div>
            <Link
              href="/best-sellers"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#0B0D12] hover:text-[#B8893B] transition-colors"
            >
              <span>Explore All Best Sellers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Brand Story Block */}
      <BrandStoryBlock />
    </div>
  );
}
