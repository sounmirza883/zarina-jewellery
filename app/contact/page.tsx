import type { Metadata } from 'next';
import { Phone, MessageCircle, Mail, MapPin, Clock, Instagram, Facebook } from 'lucide-react';
import { siteConfig } from '@/config/site';
import ContactFormClient from '@/components/ContactFormClient';

export const metadata: Metadata = {
  title: `Contact Us & WhatsApp Support | ${siteConfig.name}`,
  description: 'Get in touch with Zarina Jewels for inquiries, order tracking, and bespoke styling advice. Available via WhatsApp, phone, and email across Pakistan.',
};

export default function ContactPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block mb-2">
            We Are Here to Assist You
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#0B0D12] font-normal">
            Contact & Support
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-[#575757] leading-relaxed">
            Reach out through our official channels. Our team is available 6 days a week to assist with order confirmations, styling advice, and delivery updates.
          </p>
          <div className="w-16 h-0.5 bg-[#B8893B] mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Information & Channels */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick WhatsApp Action Box */}
            <div className="bg-[#0B0D12] text-white p-6 sm:p-8 rounded-2xl border border-[#B8893B]/40 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <MessageCircle className="w-6 h-6" />
                <span className="text-xs uppercase tracking-widest font-bold">Fastest Response</span>
              </div>
              <h2 className="font-serif text-2xl font-normal text-white">
                Chat Directly on WhatsApp
              </h2>
              <p className="text-xs text-[#CCCCCC] leading-relaxed">
                Connect with our concierge team in seconds for live photos, urgent delivery requests, or order status.
              </p>
              <a
                href={siteConfig.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs uppercase tracking-wider font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Start WhatsApp Chat</span>
              </a>
            </div>

            {/* Direct Details Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#B8893B]/20 shadow-xs space-y-5">
              <h3 className="font-serif text-xl font-medium text-[#1F1F1F]">
                Store Information
              </h3>
              <div className="space-y-4 text-xs text-[#575757]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#B8893B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1F1F1F]">Studio Address:</strong>
                    <span>{siteConfig.contact.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#B8893B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1F1F1F]">Phone Line:</strong>
                    <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-[#B8893B]">
                      {siteConfig.contact.phoneDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#B8893B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1F1F1F]">Email Support:</strong>
                    <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-[#B8893B]">
                      {siteConfig.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#B8893B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1F1F1F]">Customer Care Hours:</strong>
                    <span>{siteConfig.contact.workingHours}</span>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-[#FAF7F2] flex items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1F1F1F]">
                  Follow Us:
                </span>
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#FAF7F2] text-[#1F1F1F] hover:text-[#B8893B] hover:bg-[#F5EDE1] transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#FAF7F2] text-[#1F1F1F] hover:text-[#B8893B] hover:bg-[#F5EDE1] transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7">
            <ContactFormClient />
          </div>
        </div>
      </div>
    </div>
  );
}
