import Link from 'next/link';
import type { Metadata } from 'next';
import { Truck, ShieldCheck, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Nationwide Shipping & Delivery Information | ${siteConfig.name}`,
  description: 'Fast 2-4 days courier delivery with Cash on Delivery across Karachi, Lahore, Islamabad, and every town in Pakistan.',
};

export default function DeliveryPolicyPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#575757] mb-8">
          <Link href="/" className="hover:text-[#B8893B]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
          <span className="text-[#1F1F1F] font-medium">Delivery Information</span>
        </nav>

        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-[#B8893B]/20 shadow-xs space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8893B] font-semibold mb-2">
              <Truck className="w-4 h-4" />
              <span>Doorstep Dispatch</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
              Nationwide Delivery & Shipping Policy
            </h1>
            <p className="mt-2 text-xs text-[#575757]">Last updated: November 2026</p>
          </div>

          <div className="space-y-6 text-sm text-[#575757] leading-relaxed border-t border-[#FAF7F2] pt-6">
            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                1. Delivery Timelines
              </h2>
              <p>
                We deliver nationwide across Pakistan using premier courier services including <strong>TCS, Leopards Courier, Call Courier, and Trax</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Major Metropolitan Areas</strong> (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad): 2 to 3 business days.</li>
                <li><strong>Other Cities & Towns</strong> (Multan, Peshawar, Sialkot, Gujranwala, Quetta, Hyderabad, Sukkur): 3 to 4 business days.</li>
                <li><strong>Remote or Rural Areas</strong>: 4 to 5 business days.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                2. Shipping Rates & Free Delivery
              </h2>
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DDD0] space-y-2 text-xs sm:text-sm">
                <p>
                  <strong>Standard Flat Rate Shipping:</strong> Rs. {siteConfig.shipping.flatRate} nationwide.
                </p>
                <p className="text-emerald-800 font-semibold">
                  <strong>FREE Nationwide Delivery:</strong> On all orders totaling Rs. {siteConfig.shipping.freeShippingThreshold.toLocaleString()} or above!
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                3. Cash on Delivery (COD) Protocol
              </h2>
              <p>
                Payment is made strictly upon arrival of the package. Couriers do not accept cards at the doorstep, so please ensure you or a designated family member has the exact cash amount ready.
              </p>
              <p>
                Before parcel dispatch, our team will verify your phone number via WhatsApp or voice call. Orders with unreachable phone numbers may experience delays.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-xl text-[#1F1F1F] font-medium">
                4. Safe Packaging & Gift Boxes
              </h2>
              <p>
                Every order is nestled inside a cushioned Zarina Jewels presentation box with bubble protection to prevent any gemstone displacement or bending during transit.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-[#FAF7F2] flex items-center gap-3 text-xs text-[#1F1F1F] bg-[#FAF7F2] p-4 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-[#B8893B] shrink-0" />
            <p>
              Need to track a dispatched parcel? WhatsApp our logistics team at{' '}
              <a href={siteConfig.contact.whatsappUrl} className="text-[#B8893B] font-semibold underline">
                {siteConfig.contact.whatsappDisplay}
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
