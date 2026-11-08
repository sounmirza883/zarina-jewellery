import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HERO_VERSE } from '@/constants/verse';
import { siteConfig } from '@/config/site';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0B0D12] text-[#FAF7F2] py-20 sm:py-28 lg:py-32 border-b border-[#B8893B]/20">
      {/* Background Decorative Gold Radial Glows */}
      <div
        className="hero-fade absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[450px] sm:h-[600px] bg-[#B8893B]/10 blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="hero-fade absolute -top-24 -right-24 w-72 h-72 bg-[#D9B66A]/10 blur-[90px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle Geometric Overlay Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#B8893B 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      {/* Decorative Corner Jewellery Accents (Desktop/Tablet) */}
      <div style={{ ["--to" as string]: "0.6", ["--d" as string]: "300ms" }} className="hero-fade hidden lg:block absolute top-8 left-8 w-44 h-56 rounded-xl overflow-hidden border border-[#B8893B]/30 shadow-2xl opacity-60 hover:opacity-85 transition-opacity">
        <Image
          src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=80"
          alt="Artisanal Gold-Tone Necklace"
          fill
          priority
          sizes="176px"
          referrerPolicy="no-referrer"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-transparent to-transparent" />
      </div>

      <div style={{ ["--to" as string]: "0.6", ["--d" as string]: "420ms" }} className="hero-fade hidden lg:block absolute bottom-8 right-8 w-48 h-60 rounded-xl overflow-hidden border border-[#B8893B]/30 shadow-2xl opacity-60 hover:opacity-85 transition-opacity">
        <Image
          src="https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=500&q=80"
          alt="Handcrafted Kundan Earrings"
          fill
          priority
          sizes="192px"
          referrerPolicy="no-referrer"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D12] via-transparent to-transparent" />
      </div>

      {/* Main Hero Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        {/* Brand Pre-title Badge */}
        <div className="hero-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#B8893B]/40 bg-white/5 backdrop-blur-xs text-[#D9B66A] text-xs uppercase tracking-widest font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{siteConfig.name} • Haute Jewellery</span>
        </div>

        {/* Sacred Verse Card Container */}
        <div style={{ ["--d" as string]: "120ms" }} className="hero-rise p-6 sm:p-10 rounded-2xl bg-white/[0.03] border border-[#B8893B]/30 backdrop-blur-sm max-w-3xl mx-auto shadow-2xl">
          {/* Arabic Verse (Live Text) */}
          <p
            dir="rtl"
            lang="ar"
            className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#D9B66A] font-normal leading-relaxed sm:leading-loose tracking-wide"
          >
            {HERO_VERSE.arabicText}
          </p>

          {/* Ornamental Divider */}
          <div className="my-5 flex items-center justify-center gap-4">
            <span className="w-16 sm:w-28 h-px bg-gradient-to-r from-transparent to-[#B8893B]/60" />
            <span className="text-[#D9B66A] text-xs">✦</span>
            <span className="w-16 sm:w-28 h-px bg-gradient-to-l from-transparent to-[#B8893B]/60" />
          </div>

          {/* Urdu Translation (Live Text) */}
          <p
            dir="rtl"
            lang="ur"
            className="text-base sm:text-xl text-[#F3ECE1] font-normal leading-relaxed tracking-normal"
          >
            {HERO_VERSE.urduText}
          </p>

          {/* Reference Label */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <span className="text-[11px] sm:text-xs text-[#B8893B] tracking-wider uppercase font-medium">
              {HERO_VERSE.referenceLabel}
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p style={{ ["--d" as string]: "280ms" }} className="hero-rise mt-8 text-base sm:text-lg text-[#CCCCCC] max-w-2xl mx-auto font-light leading-relaxed">
          Adorn your everyday moments and celebrations with timeless elegance.
          Artisanal artificial jewellery designed for the modern Pakistani woman.
        </p>

        {/* CTAs */}
        <div style={{ ["--d" as string]: "400ms" }} className="hero-rise mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#B8893B] hover:bg-[#D9B66A] text-[#0B0D12] text-xs uppercase tracking-widest font-semibold rounded shadow-lg hover:shadow-xl active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/new-arrivals"
            className="w-full sm:w-auto px-8 py-3.5 border border-[#FAF7F2]/40 hover:border-[#D9B66A] hover:bg-white/5 text-[#FAF7F2] hover:text-[#D9B66A] text-xs uppercase tracking-widest font-medium rounded active:scale-[0.97] transition-all duration-300"
          >
            Explore New Arrivals
          </Link>
        </div>

        {/* Bottom Quick Feature Highlights */}
        <div style={{ ["--d" as string]: "520ms" }} className="hero-rise mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#8A8A8A]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9B66A]" />
            Cash on Delivery Nationwide
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9B66A]" />
            Hypoallergenic Finishes
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9B66A]" />
            2-4 Days Fast Dispatch
          </span>
        </div>
      </div>
    </section>
  );
}
