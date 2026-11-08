import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: 'How Zarina Jewels protects your personal data, mobile number, and delivery information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#575757] mb-8">
          <Link href="/" className="hover:text-[#B8893B]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
          <span className="text-[#1F1F1F] font-medium">Privacy Policy</span>
        </nav>

        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-[#B8893B]/20 shadow-xs space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8893B] font-semibold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Data Protection</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs text-[#575757]">Last updated: November 2026</p>
          </div>

          <div className="space-y-6 text-sm text-[#575757] leading-relaxed border-t border-[#FAF7F2] pt-6">
            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                1. Information We Collect
              </h2>
              <p>
                When you place an order on {siteConfig.name}, we collect only the necessary details required for courier delivery and phone verification: your full name, Pakistani mobile number, optional WhatsApp number, email address, and physical shipping address.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                2. No Payment Card Storage
              </h2>
              <p>
                We operate purely on a Cash on Delivery model. We do not process, collect, or store any debit card, credit card, bank passwords, or PIN details on our servers or client application.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                3. Courier & Communication Disclosure
              </h2>
              <p>
                Your phone number and physical address are shared strictly with our courier partners (e.g. TCS, Leopards, Trax) for the sole purpose of delivering your parcel. We do not sell or rent your contact details to third-party telemarketers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                4. Your Rights
              </h2>
              <p>
                You may request deletion of your order contact history from our internal database at any time by sending an email to {siteConfig.contact.email}.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
