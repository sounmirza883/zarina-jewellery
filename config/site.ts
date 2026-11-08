/**
 * Zarina Jewels - Brand and Store Configuration
 * Single source of truth for brand name, contact, policies, and currency.
 */

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  category: string;
  market: string;
  currency: {
    code: string;
    symbol: string;
    position: 'prefix' | 'suffix';
  };
  contact: {
    phone: string;
    phoneDisplay: string;
    whatsapp: string;
    whatsappDisplay: string;
    whatsappUrl: string;
    email: string;
    address: string;
    workingHours: string;
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  shipping: {
    flatRate: number;
    freeShippingThreshold: number;
    deliveryTime: string;
    paymentMethod: string;
  };
  announcement: {
    enabled: boolean;
    text: string;
    highlight: string;
  };
  provinces: string[];
  popularCities: string[];
}

export const siteConfig: SiteConfig = {
  name: "Zarina Jewels",
  tagline: "Timeless elegance, crafted for your special moments",
  description: "Discover handcrafted luxury artificial jewellery for women and girls in Pakistan. Elegant, stylish, and affordable with Cash on Delivery nationwide.",
  category: "Artificial Jewellery for Women & Girls",
  market: "Pakistan",
  currency: {
    code: "PKR",
    symbol: "Rs.",
    position: "prefix",
  },
  contact: {
    phone: "+923001234567",
    phoneDisplay: "+92 300 1234567",
    whatsapp: "+923001234567",
    whatsappDisplay: "+92 300 1234567",
    whatsappUrl: "https://wa.me/923001234567?text=Assalam%20o%20Alaikum%20Zarina%20Jewels,%20I%20have%20an%20inquiry.",
    email: "support@zarinajewels.pk",
    address: "Gulberg III, M.M. Alam Road, Lahore, Pakistan",
    workingHours: "Mon - Sat: 11:00 AM - 10:00 PM (PKT)",
  },
  social: {
    instagram: "https://instagram.com/zarinajewels.pk",
    facebook: "https://facebook.com/zarinajewels.pk",
    tiktok: "https://tiktok.com/@zarinajewels.pk",
  },
  shipping: {
    flatRate: 250,
    freeShippingThreshold: 3500,
    deliveryTime: "2 to 4 working days",
    paymentMethod: "Cash on Delivery (COD) Only",
  },
  announcement: {
    enabled: true,
    text: "✨ Cash on Delivery nationwide across Pakistan • Free shipping on orders over Rs. 3,500",
    highlight: "Free shipping over Rs. 3,500",
  },
  provinces: [
    "Punjab",
    "Sindh",
    "Khyber Pakhtunkhwa",
    "Balochistan",
    "Islamabad Capital Territory",
    "Azad Jammu & Kashmir",
    "Gilgit-Baltistan",
  ],
  popularCities: [
    "Lahore",
    "Karachi",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
    "Sialkot",
    "Gujranwala",
    "Hyderabad",
    "Bahawalpur",
    "Sargodha",
    "Abbottabad",
    "Sukkur",
    "Mardan",
  ],
};
