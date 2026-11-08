import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function BrandStoryBlock() {
  return (
    <section className="py-20 bg-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Showcase (2 photos grid) */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#B8893B]/30 shadow-2xl bg-[#F5EDE1]">
              <Image
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80"
                alt="Zarina Jewels Craftsmanship"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </div>
            
            {/* Floating Trust Card */}
            <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-[#0B0D12] text-white p-5 rounded-xl border border-[#B8893B]/40 shadow-2xl max-w-[240px]">
              <div className="flex items-center gap-2 text-[#D9B66A] mb-1.5">
                <Sparkles className="w-4 h-4" />
                <span className="text-[11px] uppercase tracking-wider font-semibold">The Zarina Standard</span>
              </div>
              <p className="text-xs text-[#CCCCCC] leading-relaxed">
                Handpicked glass kundan, AAA zircons, and rich gold-tone plating for lasting luster.
              </p>
            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-7 lg:pl-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B8893B] font-semibold">
              <span className="w-8 h-px bg-[#B8893B]" />
              <span>Our Philosophy</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#0B0D12] font-normal leading-tight">
              Elegance that belongs to every Pakistani woman.
            </h2>

            <p className="text-sm sm:text-base text-[#575757] leading-relaxed">
              At <strong className="text-[#1F1F1F] font-medium">{siteConfig.name}</strong>, we believe every woman deserves to experience the magic of royal adornment without prohibitive price tags. Our collections bridge centuries-old Mughal design heritage with crisp, modern silhouettes.
            </p>

            <p className="text-sm sm:text-base text-[#575757] leading-relaxed">
              Whether you are preparing for a cousin&apos;s mehndi, an Eid gathering, or dressing up for a weekday dinner, our artificial jewellery delivers the high-glamour feel of couture pieces at fair, honest prices with Cash on Delivery nationwide.
            </p>

            {/* Quality checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-[#1F1F1F] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#B8893B] shrink-0" />
                <span>Micro gold-tone anti-tarnish coating</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#1F1F1F] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#B8893B] shrink-0" />
                <span>Hypoallergenic & nickel-safe base</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#1F1F1F] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#B8893B] shrink-0" />
                <span>Hand-finished stone settings</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#1F1F1F] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#B8893B] shrink-0" />
                <span>Signature keepsake gift box packaging</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-7 py-3 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs uppercase tracking-widest font-medium rounded transition-colors shadow-sm"
              >
                <span>Read Our Full Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
