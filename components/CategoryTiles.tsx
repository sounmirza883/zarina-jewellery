import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CATEGORIES } from '@/data/products';
import ProductImage from './ProductImage';

export default function CategoryTiles() {
  return (
    <section className="py-16 sm:py-24 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block mb-2">
            Curated Collections
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
            Shop by Category
          </h2>
          <div className="w-12 h-0.5 bg-[#B8893B] mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative block aspect-[3/4] rounded-xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-[#FAF7F2] hover:border-[#B8893B]/40 bg-white"
            >
              {/* Category Image */}
              <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out">
                <ProductImage
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12]/85 via-[#0B0D12]/30 to-transparent group-hover:from-[#0B0D12]/90 transition-colors" />

              {/* Card Label Content */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs text-[#D9B66A] uppercase tracking-wider font-medium block mb-1">
                    {cat.count} Designs
                  </span>
                  <h3 className="font-serif text-lg sm:text-2xl text-white font-medium group-hover:text-[#D9B66A] transition-colors">
                    {cat.name}
                  </h3>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#B8893B] text-white flex items-center justify-center backdrop-blur-xs transition-colors shrink-0 mb-1">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
