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
  User,
  LogIn,
  UserPlus,
  Package,
  UserRound,
  LogOut,
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/store/cart';
import { AnimatePresence, m } from 'motion/react';
import { signOut, useSignedIn } from '@/lib/account';
import MobileMenuDrawer from './MobileMenuDrawer';
import NavMenu from './NavMenu';

const SHOP_MENU = [
  { name: 'Earrings', href: '/category/earrings' },
  { name: 'Necklaces', href: '/category/necklaces' },
  { name: 'Rings', href: '/category/rings' },
  { name: 'Bracelets', href: '/category/bracelets' },
  { name: 'New Arrivals', href: '/new-arrivals', divided: true },
  { name: 'Best Sellers', href: '/best-sellers' },
];

const HOME_LINK = { name: 'Home', href: '/' };
const INFO_LINKS = [
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
];

const navLinkClass = (active: boolean) =>
  `relative py-1 whitespace-nowrap text-xs uppercase tracking-widest font-medium transition-colors hover:text-[#B8893B] ${
    active ? 'text-[#B8893B] font-semibold' : 'text-[#1F1F1F]'
  }`;

const ACTIVE_UNDERLINE = (
  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8893B] rounded-full" />
);

const MENU_ITEM =
  'flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-medium uppercase tracking-widest transition-colors hover:bg-[#FAF7F2] hover:text-[#B8893B]';

export default function Header({ announcement }: { announcement: { enabled: boolean; text: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { items, openDrawer, openMobileMenu } = useCartStore();
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const signedIn = useSignedIn();

  const shopActive =
    pathname === '/shop' ||
    pathname.startsWith('/category/') ||
    pathname === '/new-arrivals' ||
    pathname === '/best-sellers';

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navLink = (link: { name: string; href: string }) => {
    const active = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? 'page' : undefined}
        className={navLinkClass(active)}
      >
        {link.name}
        {active && ACTIVE_UNDERLINE}
      </Link>
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
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

            {/* Desktop Navigation: Home, Shop All (hover menu), About Us, Contact Us */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
              {navLink(HOME_LINK)}
              <NavMenu
                label="Open shop menu"
                href="/shop"
                triggerClassName={navLinkClass(shopActive)}
                trigger={
                  <>
                    Shop All
                    {shopActive && ACTIVE_UNDERLINE}
                  </>
                }
              >
                {(close) =>
                  SHOP_MENU.map((link) => (
                    <div key={link.href} className={link.divided ? 'mt-1.5 pt-1.5 border-t border-[#E8DDD0]' : ''}>
                      <Link
                        href={link.href}
                        onClick={close}
                        aria-current={pathname === link.href ? 'page' : undefined}
                        className={`${MENU_ITEM} ${
                          pathname === link.href ? 'text-[#B8893B]' : 'text-[#1F1F1F]'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </div>
                  ))
                }
              </NavMenu>
              {INFO_LINKS.map(navLink)}
            </nav>

            {/* Actions: Search, Account menu, Bag */}
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

              {/* Account menu. The icon is the same size for everyone, so the bar does not shift. */}
              <NavMenu
                label="Account menu"
                align="right"
                triggerClassName="block p-2 text-[#1F1F1F] hover:text-[#B8893B] transition-colors"
                trigger={<User className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />}
              >
                {(close) =>
                  signedIn ? (
                    <>
                      <Link href="/account" onClick={close} className={`${MENU_ITEM} text-[#1F1F1F]`}>
                        <UserRound className="w-4 h-4 text-[#B8893B]" aria-hidden="true" />
                        My Details
                      </Link>
                      <Link href="/account/orders" onClick={close} className={`${MENU_ITEM} text-[#1F1F1F]`}>
                        <Package className="w-4 h-4 text-[#B8893B]" aria-hidden="true" />
                        My Orders
                      </Link>
                      <div className="mt-1.5 pt-1.5 border-t border-[#E8DDD0]">
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            void handleSignOut();
                          }}
                          className={`${MENU_ITEM} cursor-pointer text-[#575757]`}
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" />
                          Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={close} className={`${MENU_ITEM} text-[#1F1F1F]`}>
                        <LogIn className="w-4 h-4 text-[#B8893B]" aria-hidden="true" />
                        Log in
                      </Link>
                      <Link href="/signup" onClick={close} className={`${MENU_ITEM} text-[#1F1F1F]`}>
                        <UserPlus className="w-4 h-4 text-[#B8893B]" aria-hidden="true" />
                        Create account
                      </Link>
                    </>
                  )
                }
              </NavMenu>

              {/* Shopping Bag Button (icon only; the count badge shows what is inside) */}
              <button
                type="button"
                onClick={openDrawer}
                className="relative p-2 text-[#1F1F1F] hover:text-[#B8893B] transition-colors"
                aria-label={`Shopping bag with ${totalItemCount} items`}
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                <AnimatePresence initial={false}>
                  {totalItemCount > 0 && (
                    <m.span
                      key={totalItemCount}
                      initial={{ scale: 1.6 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      className="absolute -top-1 -right-1 bg-[#0B0D12] text-[#FAF7F2] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF7F2]"
                    >
                      {totalItemCount}
                    </m.span>
                  )}
                </AnimatePresence>
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
