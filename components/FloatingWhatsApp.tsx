'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function FloatingWhatsApp() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }
  return (
    <aside aria-label="Support and Quick Contact" className="fixed bottom-6 right-6 z-40">
      <a
        href={siteConfig.contact.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Zarina Jewels on WhatsApp for orders and inquiries"
        className="group relative flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      >
        <MessageCircle className="w-7 h-7" />

        {/* Pulse effect */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-30 animate-ping -z-10" />

        {/* Floating Tooltip Bubble on Desktop */}
        <span className="hidden md:group-hover:flex absolute right-16 top-1/2 -translate-y-1/2 bg-[#0B0D12] text-white text-xs font-medium py-1.5 px-3 rounded shadow-lg whitespace-nowrap items-center gap-1.5 border border-[#B8893B]/40 pointer-events-none transition-all">
          <span>Need help? Chat on WhatsApp</span>
        </span>
      </a>
    </aside>
  );
}
