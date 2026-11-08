import Link from 'next/link';
import type { Metadata } from 'next';
import { FileText, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Terms of Service | ${siteConfig.name}`,
  description: 'Terms and conditions for browsing, ordering, and receiving artificial jewellery from Zarina Jewels.',
};

export default function TermsPolicyPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#575757] mb-8">
          <Link href="/" className="hover:text-[#B8893B]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
          <span className="text-[#1F1F1F] font-medium">Terms of Service</span>
        </nav>

        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-[#B8893B]/20 shadow-xs space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8893B] font-semibold mb-2">
              <FileText className="w-4 h-4" />
              <span>Service Agreement</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs text-[#575757]">Last updated: November 2026</p>
          </div>

          <div className="space-y-6 text-sm text-[#575757] leading-relaxed border-t border-[#FAF7F2] pt-6">
            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                1. Nature of Products
              </h2>
              <p>
                All items offered by {siteConfig.name} are premium artificial (fashion) jewellery crafted with high-grade metal alloys, micro gold-tone plating, synthetic cubic zirconia, glass kundan, and simulated pearls. None of our products contain solid gold, real natural mined diamonds, or certified precious gems.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                2. Order Acceptance & Verification
              </h2>
              <p>
                Placement of an order constitutes an offer to purchase. Because all items are fulfilled via Cash on Delivery, {siteConfig.name} reserves the right to confirm every order via voice phone call or WhatsApp message before dispatching. Unreachable phone numbers or unconfirmed orders may be cancelled.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                3. Pricing & Currency
              </h2>
              <p>
                All prices are clearly stated in Pakistani Rupees (PKR / Rs.) and are inclusive of standard local packaging. We reserve the right to correct accidental pricing errors before order dispatch.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                4. Jewellery Care & Longevity
              </h2>
              <p>
                To maintain the luster of your gold-tone jewellery, please avoid direct exposure to water, harsh perfumes, sanitizers, or chlorine. Store individual pieces inside their protective pouches when not in use.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
