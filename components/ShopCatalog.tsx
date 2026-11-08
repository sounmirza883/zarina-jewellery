'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { Product, ProductCategory } from '@/types/product';
import ProductCard from './ProductCard';

interface ShopCatalogProps {
  initialProducts: Product[];
  defaultCategory?: ProductCategory | 'all';
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function ShopCatalog({
  initialProducts,
  defaultCategory = 'all',
  pageTitle = 'The Collection',
  pageSubtitle = 'Discover timeless Pakistani artificial jewellery crafted for your moments of celebration.',
}: ShopCatalogProps) {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const productsList = initialProducts;
  const [category, setCategory] = useState<ProductCategory | 'all'>(defaultCategory);
  const [search, setSearch] = useState<string>(queryParam);
  const [sort, setSort] = useState<'newest' | 'price-low' | 'price-high' | 'best-selling'>('newest');
  const [priceTier, setPriceTier] = useState<'all' | 'under-2000' | '2000-3500' | 'above-3500'>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync search param during render when URL query changes
  const [prevQueryParam, setPrevQueryParam] = useState(queryParam);
  if (queryParam !== prevQueryParam) {
    setPrevQueryParam(queryParam);
    setSearch(queryParam);
  }

  const categories: { label: string; value: ProductCategory | 'all' }[] = [
    { label: 'All Pieces', value: 'all' },
    { label: 'Earrings', value: 'earrings' },
    { label: 'Necklaces', value: 'necklaces' },
    { label: 'Rings', value: 'rings' },
    { label: 'Bracelets', value: 'bracelets' },
  ];

  const filteredProducts = useMemo(() => {
    let list = [...productsList];

    // Filter by Category
    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }

    // Filter by Search
    if (search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
        return matchName || matchDesc || matchCategory || matchTags;
      });
    }

    // Filter by Price Tier
    if (priceTier === 'under-2000') {
      list = list.filter((p) => p.price < 2000);
    } else if (priceTier === '2000-3500') {
      list = list.filter((p) => p.price >= 2000 && p.price <= 3500);
    } else if (priceTier === 'above-3500') {
      list = list.filter((p) => p.price > 3500);
    }

    // Sort
    if (sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'best-selling') {
      list.sort((a, b) => (b.isBestSeller === a.isBestSeller ? 0 : b.isBestSeller ? 1 : -1));
    } else {
      // Default newest
      list.sort((a, b) => (b.isNew === a.isNew ? 0 : b.isNew ? 1 : -1));
    }

    return list;
  }, [productsList, category, search, priceTier, sort]);

  const hasActiveFilters = category !== 'all' || search !== '' || priceTier !== 'all' || sort !== 'newest';

  const resetFilters = () => {
    setCategory('all');
    setSearch('');
    setPriceTier('all');
    setSort('newest');
  };

  return (
    <div className="py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block mb-2">
            Zarina Jewels Catalogue
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#0B0D12] font-normal tracking-tight">
            {pageTitle}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#575757] leading-relaxed">
            {pageSubtitle}
          </p>
          <div className="w-16 h-0.5 bg-[#B8893B] mx-auto mt-4" />
        </div>

        {/* Filter & Controls Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#B8893B]/20 shadow-xs mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jewellery by stone, style, or title..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden focus:border-[#B8893B]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#1F1F1F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Quick Filter Toggle for Mobile */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="md:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#E8DDD0] rounded bg-[#FAF7F2] text-[#1F1F1F]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#575757] whitespace-nowrap hidden sm:inline">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md px-3 py-2 text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                >
                  <option value="newest">Newest First</option>
                  <option value="best-selling">Best Sellers</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Chips (Desktop & visible by default) */}
          <div className={`pt-3 border-t border-[#FAF7F2] flex flex-wrap items-center justify-between gap-3 ${mobileFilterOpen ? 'block' : 'hidden md:flex'}`}>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-[#8A8A8A] font-medium mr-1 hidden lg:inline">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                    category === cat.value
                      ? 'bg-[#0B0D12] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#575757] hover:bg-[#F3ECE1] hover:text-[#1F1F1F]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Price Range Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-[#8A8A8A] font-medium mr-1 hidden lg:inline">Price:</span>
              <button
                type="button"
                onClick={() => setPriceTier('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                  priceTier === 'all'
                    ? 'bg-[#B8893B] text-white'
                    : 'bg-[#FAF7F2] text-[#575757] hover:bg-[#F3ECE1]'
                }`}
              >
                All Prices
              </button>
              <button
                type="button"
                onClick={() => setPriceTier('under-2000')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                  priceTier === 'under-2000'
                    ? 'bg-[#B8893B] text-white'
                    : 'bg-[#FAF7F2] text-[#575757] hover:bg-[#F3ECE1]'
                }`}
              >
                Under Rs. 2,000
              </button>
              <button
                type="button"
                onClick={() => setPriceTier('2000-3500')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                  priceTier === '2000-3500'
                    ? 'bg-[#B8893B] text-white'
                    : 'bg-[#FAF7F2] text-[#575757] hover:bg-[#F3ECE1]'
                }`}
              >
                Rs. 2,000 - 3,500
              </button>
              <button
                type="button"
                onClick={() => setPriceTier('above-3500')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                  priceTier === 'above-3500'
                    ? 'bg-[#B8893B] text-white'
                    : 'bg-[#FAF7F2] text-[#575757] hover:bg-[#F3ECE1]'
                }`}
              >
                Over Rs. 3,500
              </button>
            </div>
          </div>

          {/* Active Filter Summary and Clear All */}
          {hasActiveFilters && (
            <div className="pt-2 flex items-center justify-between text-xs text-[#575757] border-t border-[#FAF7F2]">
              <span>
                Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'piece' : 'pieces'}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[#B8893B] hover:text-[#0B0D12] font-medium underline underline-offset-2 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset all filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-[#FAF7F2] p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#B8893B] mx-auto mb-4">
              <Sparkles className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#1F1F1F] mb-2">
              No matching jewellery found
            </h3>
            <p className="text-xs text-[#575757] mb-6 leading-relaxed">
              We couldn&apos;t find any pieces matching your current filters. Try searching with different terms or reset your filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2.5 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs uppercase tracking-wider font-medium rounded transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
