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
import { useSignedIn } from '@/lib/account';

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
  const signedIn = useSignedIn();

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
    signedIn
      ? { name: 'My Account & Orders', href: '/account' }
      : { name: 'Log In / Create Account', href: '/login' },
    { name: 'Our Story & Heritage', href: '/about' },
    { name: 'Contact & Support', href: '/contact' },
    { name: '7-Day Return Policy', href: '/policies/returns' },
    { name: 'Delivery Information', href: '/policies/delivery' },
    { name: 'Admin Portal (Merchant)', href: '/admin' },
  ];

  const content = (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Side Drawer Panel (Sliding in from the Left, Full Viewport Height) */}
      <div
        className="relative w-80 max-w-[85vw] h-full bg-[#FAF7F2] shadow-2xl border-r border-[#B8893B]/30 flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-300 z-50 text-[#1F1F1F]"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#B8893B]/20 flex items-center justify-between shrink-0 bg-white">
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
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jewellery..."
              className="w-full pl-10 pr-3 py-2 text-xs bg-white text-[#1F1F1F] placeholder-[#8A8A8A] rounded-lg border border-[#B8893B]/30 focus:outline-hidden focus:border-[#B8893B] shadow-2xs"
            />
          </form>

          {/* Categories Grid */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#B8893B] font-semibold mb-2.5">
              <Gem className="w-3.5 h-3.5" />
              <span>Collections</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  onClick={closeMobileMenu}
                  className="p-2.5 bg-white hover:bg-[#F5EDE1] rounded-lg border border-[#E8DDD0] hover:border-[#B8893B]/50 shadow-2xs transition-all flex flex-col"
                >
                  <span className="font-serif text-xs font-semibold text-[#1F1F1F]">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-[#8A8A8A] mt-0.5 truncate">
                    {cat.subtitle}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[#575757] font-semibold mb-2">
              Menu & Policies
            </div>
            <nav className="divide-y divide-[#E8DDD0]/60 bg-white rounded-lg border border-[#E8DDD0] overflow-hidden shadow-2xs">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="px-3.5 py-2.5 text-xs font-medium text-[#1F1F1F] hover:text-[#B8893B] hover:bg-[#FAF7F2] flex items-center justify-between transition-colors"
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Pushed to the Bottom: WhatsApp & Contact Actions */}
        <div className="p-4 bg-white border-t border-[#B8893B]/20 shrink-0 space-y-2.5 shadow-lg">
          <a
            href={siteConfig.contact.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs uppercase tracking-wider font-semibold shadow transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Order & Help</span>
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
              <span>COD Nationwide</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
