'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Phone, Mail, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-[#0B0D12] text-[#FAF7F2] border-t border-[#B8893B]/30 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="font-serif text-2xl sm:text-3xl tracking-wider text-white group-hover:text-[#D9B66A] transition-colors">
                {siteConfig.name}
              </span>
              <Sparkles className="w-4 h-4 text-[#D9B66A]" />
            </Link>
            <p className="text-sm text-[#A0A0A0] leading-relaxed max-w-sm">
              Pakistan’s premier destination for exquisite artificial jewellery. Handcrafted elegance, premium gold-tone finishes, and radiant zircon crystals delivered directly to your doorstep.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#D9B66A]">
              <ShieldCheck className="w-4 h-4 text-[#D9B66A]" />
              <span className="font-medium tracking-wide">100% Cash on Delivery Across Pakistan</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="font-serif text-base text-[#D9B66A] tracking-wider uppercase font-medium mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs tracking-wide text-[#CCCCCC]">
              <li>
                <Link href="/category/earrings" className="hover:text-[#D9B66A] transition-colors">
                  Earrings & Chandbalis
                </Link>
              </li>
              <li>
                <Link href="/category/necklaces" className="hover:text-[#D9B66A] transition-colors">
                  Necklaces & Choker Sets
                </Link>
              </li>
              <li>
                <Link href="/category/rings" className="hover:text-[#D9B66A] transition-colors">
                  Rings & Cocktail Bands
                </Link>
              </li>
              <li>
                <Link href="/category/bracelets" className="hover:text-[#D9B66A] transition-colors">
                  Bracelets & Kundan Karas
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="hover:text-[#D9B66A] transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/best-sellers" className="hover:text-[#D9B66A] transition-colors">
                  Best Sellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div>
            <h4 className="font-serif text-base text-[#D9B66A] tracking-wider uppercase font-medium mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs tracking-wide text-[#CCCCCC]">
              <li>
                <Link href="/about" className="hover:text-[#D9B66A] transition-colors">
                  Our Story & Promise
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#D9B66A] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-[#D9B66A] transition-colors">
                  7-Day Return Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/delivery" className="hover:text-[#D9B66A] transition-colors">
                  Delivery & Shipping
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-[#D9B66A] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-[#D9B66A] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li className="pt-1.5 border-t border-white/10">
                <Link href="/admin" className="text-[#D9B66A] hover:text-white transition-colors flex items-center gap-1 font-medium">
                  <span>Merchant Admin Portal</span>
                  <span className="text-[10px] bg-[#B8893B]/20 text-[#D9B66A] px-1.5 py-0.5 rounded">PIN</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-3">
            <h4 className="font-serif text-base text-[#D9B66A] tracking-wider uppercase font-medium mb-4">
              Contact & Support
            </h4>
            <div className="space-y-2.5 text-xs text-[#CCCCCC]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D9B66A] shrink-0 mt-0.5" />
                <span>{siteConfig.contact.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D9B66A] shrink-0" />
                <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-[#D9B66A]">
                  {siteConfig.contact.phoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D9B66A] shrink-0" />
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-[#D9B66A]">
                  {siteConfig.contact.email}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#D9B66A] shrink-0 mt-0.5" />
                <span>{siteConfig.contact.workingHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8A8A] gap-4">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[#CCCCCC]">
            <span className="inline-flex items-center gap-1">
              Payment: <strong className="text-white font-normal">Cash on Delivery (COD) Only</strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              Crafted with <Heart className="w-3.5 h-3.5 text-[#B8893B] fill-current" /> for Pakistan
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
