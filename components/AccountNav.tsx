'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { name: 'My Details', href: '/account' },
  { name: 'My Orders', href: '/account/orders' },
];

export default function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="mb-6 flex justify-center gap-2 text-xs font-semibold uppercase tracking-wider">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? 'page' : undefined}
          className={`px-4 py-2 rounded-full border transition-colors ${
            pathname === link.href
              ? 'bg-[#0B0D12] text-white border-[#0B0D12]'
              : 'bg-white text-[#1F1F1F] border-[#E8DDD0] hover:border-[#B8893B]'
          }`}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
}
