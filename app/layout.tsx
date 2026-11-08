import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond, Amiri, Noto_Nastaliq_Urdu } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import ToastNotification from '@/components/ToastNotification';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-urdu',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://zarinajewels.pk'),
  title: {
    default: `${siteConfig.name} | Artificial Jewellery in Pakistan`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'artificial jewellery Pakistan',
    'kundan jewellery',
    'bridal choker set',
    'chandbali earrings',
    'cash on delivery jewellery',
    'zircon rings Lahore Karachi Islamabad',
    'Zarina Jewels',
  ],
  openGraph: {
    title: `${siteConfig.name} | Artificial Jewellery in Pakistan`,
    description: siteConfig.description,
    url: 'https://zarinajewels.pk',
    siteName: siteConfig.name,
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} | Artificial Jewellery in Pakistan`,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorantGaramond.variable} ${amiri.variable} ${notoNastaliq.variable}`}
    >
      <body className="bg-[#FAF7F2] text-[#1F1F1F] min-h-screen flex flex-col font-sans selection:bg-[#B8893B]/20 selection:text-[#0B0D12]" suppressHydrationWarning>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <FloatingWhatsApp />
        <ToastNotification />
      </body>
    </html>
  );
}
