'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Sparkles,
  MessageCircle,
  Truck,
  User,
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/store/cart';
import { useSignedIn } from '@/lib/account';
import MobileMenuDrawer from './MobileMenuDrawer';

export default function Header({ announcement }: { announcement: { enabled: boolean; text: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { items, openDrawer, openMobileMenu } = useCartStore();
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const signedIn = useSignedIn();

  const navLinks = [
    { name: 'Shop All', href: '/shop' },
    { name: 'Earrings', href: '/category/earrings' },
    { name: 'Necklaces', href: '/category/necklaces' },
    { name: 'Rings', href: '/category/rings' },
    { name: 'Bracelets', href: '/category/bracelets' },
    { name: 'New Arrivals', href: '/new-arrivals' },
    { name: 'Best Sellers', href: '/best-sellers' },
  ];

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#FAF7F2] border-b border-[#B8893B]/20">
        {/* Top Announcement Bar */}
        {announcement.enabled && (
          <div className="bg-[#0B0D12] text-[#FAF7F2] text-[11px] sm:text-xs py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 border-b border-[#B8893B]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#D9B66A] shrink-0" />
            <span>{announcement.text}</span>
          </div>
        )}

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Mobile menu trigger */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={openMobileMenu}
                className="p-2 -ml-2 text-[#1F1F1F] hover:text-[#B8893B] focus:outline-hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 ml-1 text-[#1F1F1F] hover:text-[#B8893B] focus:outline-hidden"
                aria-label="Open search dialog"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex items-center justify-center lg:justify-start">
              <Link
                href="/"
                className="flex flex-col items-center lg:items-start group"
                aria-label={`${siteConfig.name} Home`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-2xl sm:text-3xl font-normal tracking-wider text-[#0B0D12] group-hover:text-[#B8893B] transition-colors">
                    {siteConfig.name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8893B] inline-block mb-1"></span>
                </div>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#575757] -mt-1 hidden sm:block">
                  Artisanal Jewellery
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-7">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-xs uppercase tracking-widest font-medium transition-colors hover:text-[#B8893B] relative py-1 ${
                      isActive ? 'text-[#B8893B] font-semibold' : 'text-[#1F1F1F]'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8893B] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions: Search, Contact/WhatsApp, Cart */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden lg:flex items-center gap-1.5 text-xs text-[#575757] hover:text-[#B8893B] p-2 rounded-md transition-colors"
                aria-label="Search collection"
              >
                <Search className="w-4 h-4" />
                <span className="tracking-wide">Search</span>
              </button>

              <a
                href={siteConfig.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs text-[#1F1F1F] hover:text-[#B8893B] px-2.5 py-1.5 rounded-full border border-[#B8893B]/30 hover:border-[#B8893B] bg-white transition-all shadow-2xs"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-[11px] tracking-wider uppercase">WhatsApp</span>
              </a>

              {/* Order tracking (desktop; the mobile menu has its own link) */}
              <Link
                href="/track-order"
                className="hidden lg:flex items-center gap-1.5 p-2 text-[#1F1F1F] hover:text-[#B8893B] transition-colors"
                aria-label="Track your order"
                title="Track your order"
              >
                <Truck className="w-5 h-5" />
                <span className="hidden xl:inline text-xs font-semibold tracking-wider">Track</span>
              </Link>

              {/* Account: icon only so the bar does not shift when the session is detected */}
              <Link
                href={signedIn ? '/account' : '/login'}
                className="p-2 text-[#1F1F1F] hover:text-[#B8893B] transition-colors"
                aria-label={signedIn ? 'My account' : 'Log in or create an account'}
                title={signedIn ? 'My account' : 'Log in'}
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>

              {/* Shopping Bag Button */}
              <button
                type="button"
                onClick={openDrawer}
                className="relative p-2 text-[#1F1F1F] hover:text-[#B8893B] transition-colors flex items-center gap-1.5"
                aria-label={`Shopping bag with ${totalItemCount} items`}
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline-block text-xs font-semibold tracking-wider">
                  Bag
                </span>
                {totalItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#0B0D12] text-[#FAF7F2] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF7F2]">
                    {totalItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Input Bar (Dropdown) */}
        {searchOpen && (
          <div className="border-t border-[#B8893B]/20 bg-white py-3 px-4 shadow-md transition-all">
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
              <Search className="w-5 h-5 text-[#575757]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by jewellery piece, kundan, zircon, rings, earrings..."
                className="flex-1 bg-transparent py-2 px-2 text-sm text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0B0D12] text-white text-xs font-medium uppercase tracking-wider rounded hover:bg-[#B8893B] transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 text-[#575757] hover:text-[#1F1F1F]"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Drawer Menu (Portaled and pushed to bottom) */}
      <MobileMenuDrawer />
    </>
  );
}
