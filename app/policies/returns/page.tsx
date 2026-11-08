import Link from 'next/link';
import type { Metadata } from 'next';
import { RotateCcw, ShieldCheck, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `7-Day Return & Exchange Policy | ${siteConfig.name}`,
  description: 'Learn about our 7-day hassle-free return and exchange process for artificial jewellery across Pakistan.',
};

export default function ReturnsPolicyPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#575757] mb-8">
          <Link href="/" className="hover:text-[#B8893B]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
          <span className="text-[#1F1F1F] font-medium">Returns Policy</span>
        </nav>

        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-[#B8893B]/20 shadow-xs space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8893B] font-semibold mb-2">
              <RotateCcw className="w-4 h-4" />
              <span>Customer Confidence</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
              7-Day Return & Exchange Policy
            </h1>
            <p className="mt-2 text-xs text-[#575757]">Last updated: November 2026</p>
          </div>

          <div className="space-y-6 text-sm text-[#575757] leading-relaxed border-t border-[#FAF7F2] pt-6">
            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                1. Our Quality Guarantee
              </h2>
              <p>
                At {siteConfig.name}, we hold our jewellery to meticulous standards. If any item arrives damaged, defective, or does not match the product photograph, you are eligible for an immediate replacement or exchange within <strong>7 days of delivery</strong>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                2. Conditions for Return & Exchange
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Items must be unworn, undamaged, and returned in their original Zarina Jewels keepsake box.</li>
                <li>Earrings cannot be returned if hygiene seals are broken, unless received defective upon parcel opening.</li>
                <li>Notification must be submitted to our WhatsApp or email within 7 calendar days of courier delivery.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                3. How to Initiate a Return
              </h2>
              <p>
                Simply send a photo or short video clip of the received item along with your order reference number (e.g., ZJ-XXXXX) to our official WhatsApp support line at <strong>{siteConfig.contact.whatsappDisplay}</strong>.
              </p>
              <p>
                Our team will verify the claim and arrange a return pickup or provide courier instructions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                4. Refunds on Cash on Delivery Orders
              </h2>
              <p>
                Because all orders are fulfilled via Cash on Delivery, approved refunds are transferred directly via secure online bank transfer, Raast, JazzCash, or Easypaisa within 3-5 business days after our inspection team receives the parcel.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-[#FAF7F2] flex items-center gap-3 text-xs text-[#1F1F1F] bg-[#FAF7F2] p-4 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-[#B8893B] shrink-0" />
            <p>
              Questions regarding an exchange? Reach out anytime via{' '}
              <a href={siteConfig.contact.whatsappUrl} className="text-[#B8893B] font-semibold underline">
                WhatsApp Support
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
