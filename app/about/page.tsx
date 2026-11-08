import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Sparkles, Heart, Award, ShieldCheck, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Our Story & Philosophy | ${siteConfig.name}`,
  description: 'Learn about the vision, craftsmanship, and founding story of Zarina Jewels - bringing luxurious, affordable artificial jewellery to women across Pakistan.',
};

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block mb-2">
            The Heritage of Zarina
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#0B0D12] font-normal leading-tight">
            Crafting Elegance for Every Pakistani Woman
          </h1>
          <div className="w-16 h-0.5 bg-[#B8893B] mx-auto mt-4" />
        </div>

        {/* Narrative Section with Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#B8893B]/30 shadow-xl bg-[#F5EDE1]">
            <Image
              src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80"
              alt="Handcrafted Kundan Artistry"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>

          <div className="space-y-5 text-sm sm:text-base text-[#575757] leading-relaxed">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#0B0D12] font-normal">
              Our Founding Story
            </h2>
            <p>
              Founded in Lahore, <strong>{siteConfig.name}</strong> was born from a simple observation: Pakistani weddings, family gatherings, and festive seasons call for majestic adornment, yet fine gold is increasingly inaccessible for everyday versatility.
            </p>
            <p>
              We set out to create an artificial jewellery atelier that refuses to compromise. By merging the regal heritage of Mughal Kundan, Polki glasswork, and high-clarity cubic zirconia with durable gold-tone plating, we offer pieces that look and feel regal without the heirloom price tag.
            </p>
            <p>
              Today, from Karachi to Peshawar, thousands of women celebrate their engagements, Eid mornings, and milestone days in Zarina Jewels.
            </p>
          </div>
        </div>

        {/* Vision & Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="bg-white p-8 rounded-xl border border-[#B8893B]/25 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] text-[#B8893B] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#1F1F1F]">
              Our Vision
            </h3>
            <p className="text-xs sm:text-sm text-[#575757] leading-relaxed">
              To be Pakistan’s most trusted artificial jewellery brand, recognized for impeccable aesthetics, enduring finishes, and complete transparency.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-[#B8893B]/25 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] text-[#B8893B] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#1F1F1F]">
              Our Mission
            </h3>
            <p className="text-xs sm:text-sm text-[#575757] leading-relaxed">
              To deliver breathtaking, wearable art with nationwide Cash on Delivery, ensuring every customer feels cherished, confident, and celebrated.
            </p>
          </div>
        </div>

        {/* Message from CEO with placeholder portrait */}
        <div className="bg-[#0B0D12] text-white p-8 sm:p-12 rounded-2xl border border-[#B8893B]/40 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
            <div className="sm:col-span-4 relative aspect-[3/4] rounded-xl overflow-hidden border border-[#D9B66A]/40 bg-[#161A22]">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                alt="Founder & Creative Director of Zarina Jewels"
                fill
                sizes="(max-width: 640px) 100vw, 30vw"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </div>

            <div className="sm:col-span-8 space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#D9B66A] font-medium block">
                Founder&apos;s Letter
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                &ldquo;True beauty is dignity, grace, and confidence.&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed italic">
                &ldquo;When we launched Zarina Jewels, we made an uncompromising vow: to craft pieces that honor the timeless traditions of our soil, while treating every customer with utter respect and warmth. Every piece you receive in our signature box is inspected by hand. We thank you for welcoming us into your most cherished celebrations.&rdquo;
              </p>
              <div className="pt-2">
                <p className="font-serif text-base text-[#D9B66A] font-medium">Zarina Afzal</p>
                <p className="text-xs text-[#8A8A8A]">Founder & Creative Director, {siteConfig.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="text-center pt-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#B8893B] hover:bg-[#D9B66A] text-[#0B0D12] text-xs uppercase tracking-widest font-semibold rounded shadow transition-colors"
          >
            <span>Explore the Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
