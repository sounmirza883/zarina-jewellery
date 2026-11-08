'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Search,
  Phone,
  MessageCircle,
  Gem,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/store/cart';

function subscribe() {
  return () => {};
}

export default function MobileMenuDrawer() {
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { isMobileMenuOpen, closeMobileMenu } = useCartStore();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  if (!isMounted || !isMobileMenuOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      closeMobileMenu();
      setSearchQuery('');
    }
  };

  const categories = [
    { name: 'Earrings', href: '/category/earrings', subtitle: 'Chandbalis & Jhumkas' },
    { name: 'Necklaces', href: '/category/necklaces', subtitle: 'Chokers & Malas' },
    { name: 'Rings', href: '/category/rings', subtitle: 'Cocktails & Bands' },
    { name: 'Bracelets', href: '/category/bracelets', subtitle: 'Karas & Bangles' },
  ];

  const quickLinks = [
    { name: 'Shop All Pieces', href: '/shop' },
    { name: 'New Arrivals', href: '/new-arrivals' },
    { name: 'Best Sellers', href: '/best-sellers' },
    { name: 'Our Story & Heritage', href: '/about' },
    { name: 'Contact & Support', href: '/contact' },
    { name: '7-Day Return Policy', href: '/policies/returns' },
    { name: 'Delivery Information', href: '/policies/delivery' },
  ];

  const content = (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Bottom Sheet Modal Panel (Pushed to bottom) */}
      <div
        className="relative w-full max-h-[88vh] bg-[#FAF7F2] rounded-t-3xl shadow-2xl border-t border-[#B8893B]/40 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 z-50 text-[#1F1F1F]"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Top Pull Handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-[#B8893B]/40 rounded-full" />
        </div>

        {/* Drawer Header */}
        <div className="px-6 py-3 border-b border-[#B8893B]/20 flex items-center justify-between shrink-0 bg-white/70">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-1.5 group"
          >
            <span className="font-serif text-2xl font-normal tracking-wider text-[#0B0D12]">
              {siteConfig.name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8893B] inline-block mb-1"></span>
          </Link>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="p-1.5 text-[#575757] hover:text-[#1F1F1F] rounded-full hover:bg-[#FAF7F2] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by jewellery piece, kundan, zircon..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-xs sm:text-sm text-[#1F1F1F] placeholder-[#8A8A8A] rounded-xl border border-[#B8893B]/30 focus:outline-hidden focus:border-[#B8893B] shadow-2xs"
            />
          </form>

          {/* Categories 2x2 Grid */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#B8893B] font-semibold mb-2.5">
              <Gem className="w-3.5 h-3.5" />
              <span>Explore Categories</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  onClick={closeMobileMenu}
                  className="p-3 bg-white hover:bg-[#F5EDE1] rounded-xl border border-[#E8DDD0] hover:border-[#B8893B]/50 shadow-2xs transition-all flex flex-col justify-between"
                >
                  <span className="font-serif text-sm font-medium text-[#1F1F1F]">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-[#8A8A8A] mt-0.5">
                    {cat.subtitle}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links List */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[#575757] font-semibold mb-2">
              Collections & Help
            </div>
            <nav className="divide-y divide-[#E8DDD0]/60 bg-white rounded-xl border border-[#E8DDD0] overflow-hidden shadow-2xs">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-xs font-medium text-[#1F1F1F] hover:text-[#B8893B] hover:bg-[#FAF7F2] flex items-center justify-between transition-colors"
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Pinned Footer & WhatsApp CTA (Pushed to bottom) */}
        <div className="px-6 py-4 bg-white border-t border-[#B8893B]/20 shrink-0 space-y-2.5 shadow-lg">
          <a
            href={siteConfig.contact.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs uppercase tracking-wider font-semibold shadow-md transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Order or Inquire via WhatsApp</span>
          </a>

          <div className="flex items-center justify-between text-[11px] text-[#575757] pt-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#B8893B]" />
              <a href={`tel:${siteConfig.contact.phone}`} className="font-medium hover:text-[#B8893B]">
                {siteConfig.contact.phoneDisplay}
              </a>
            </span>
            <span className="flex items-center gap-1 text-emerald-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cash on Delivery</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
