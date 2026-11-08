import Link from 'next/link';
import { Sparkles, ArrowRight, Home } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-white p-8 sm:p-12 rounded-2xl border border-[#B8893B]/30 shadow-lg text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#B8893B] flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block">
          {siteConfig.name}
        </span>

        <h1 className="font-serif text-5xl sm:text-6xl text-[#0B0D12] font-normal tracking-tight">
          404
        </h1>

        <h2 className="font-serif text-xl sm:text-2xl text-[#1F1F1F] font-medium">
          Jewellery Piece Not Found
        </h2>

        <p className="text-xs sm:text-sm text-[#575757] leading-relaxed">
          The page or product you are looking for has been moved or is no longer available in our active collection.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FAF7F2] hover:bg-[#F5EDE1] text-[#0B0D12] text-xs uppercase tracking-wider font-semibold rounded border border-[#E8DDD0] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Home</span>
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs uppercase tracking-wider font-semibold rounded shadow transition-colors"
          >
            <span>Explore Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
