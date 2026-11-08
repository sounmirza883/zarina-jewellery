'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Menu, MessageCircle, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { siteConfig } from '@/config/site';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { items, openDrawer, openMobileMenu } = useCartStore();
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#B8893B]/25 py-1.5 px-3 shadow-lg"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
            pathname === '/' ? 'text-[#B8893B]' : 'text-[#575757] hover:text-[#1F1F1F]'
          }`}
          aria-label="Home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </Link>

        {/* Shop */}
        <Link
          href="/shop"
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
            pathname.startsWith('/shop') ? 'text-[#B8893B]' : 'text-[#575757] hover:text-[#1F1F1F]'
          }`}
          aria-label="Shop"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">Shop</span>
        </Link>

        {/* Menu / Categories Trigger (Pushed to bottom) */}
        <button
          type="button"
          onClick={openMobileMenu}
          className="flex flex-col items-center gap-1 p-1.5 text-[#575757] hover:text-[#B8893B] transition-colors focus:outline-hidden"
          aria-label="Open Categories Menu"
        >
          <div className="w-8 h-8 -mt-3 rounded-full bg-[#0B0D12] text-[#D9B66A] flex items-center justify-center shadow-md border border-[#B8893B]/40">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium tracking-wide text-[#0B0D12]">Menu</span>
        </button>

        {/* WhatsApp Quick Order */}
        <a
          href={siteConfig.contact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 p-1.5 text-emerald-700 hover:text-emerald-800 transition-colors"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">WhatsApp</span>
        </a>

        {/* Shopping Bag */}
        <button
          type="button"
          onClick={openDrawer}
          className="relative flex flex-col items-center gap-1 p-1.5 text-[#575757] hover:text-[#B8893B] transition-colors focus:outline-hidden"
          aria-label={`Shopping bag with ${totalItemCount} items`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">Bag</span>
          {totalItemCount > 0 && (
            <span className="absolute top-0 right-1 bg-[#0B0D12] text-[#FAF7F2] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
              {totalItemCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
