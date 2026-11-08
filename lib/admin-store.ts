import { PRODUCTS } from '@/data/products';
import { Product, Order, OrderStatus } from '@/types/product';
import { siteConfig } from '@/config/site';

export interface AdminSettings {
  announcementText: string;
  announcementEnabled: boolean;
  whatsappNumber: string;
  contactPhone: string;
  supportEmail: string;
  studioAddress: string;
  flatShippingRate: number;
  freeShippingThreshold: number;
  codNotice: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  announcementText: siteConfig.announcement.text,
  announcementEnabled: siteConfig.announcement.enabled,
  whatsappNumber: siteConfig.contact.whatsapp,
  contactPhone: siteConfig.contact.phone,
  supportEmail: siteConfig.contact.email,
  studioAddress: siteConfig.contact.address,
  flatShippingRate: siteConfig.shipping.flatRate,
  freeShippingThreshold: siteConfig.shipping.freeShippingThreshold,
  codNotice: 'Cash on Delivery (COD) Only - Pay when you receive parcel',
};

// Realistic Seed Orders for Pakistani artificial jewellery storefront
export const INITIAL_SEED_ORDERS: Order[] = [
  {
    orderNumber: 'ZJ-98214',
    items: [
      {
        cartItemId: 'zarina-1-Gold-Tone-Standard',
        product: PRODUCTS[0], // Royal Kundan Chandbali Earrings
        quantity: 1,
        selectedColor: 'Gold-Tone with Pearls',
      },
      {
        cartItemId: 'zarina-3-Ruby-Red-Standard',
        product: PRODUCTS[2], // Noor Bridal Choker
        quantity: 1,
        selectedColor: 'Antique Gold with Ruby Accents',
      },
    ],
    subtotal: 7300,
    shipping: 0,
    total: 7300,
    customer: {
      fullName: 'Amina Farooq',
      phone: '03014589231',
      whatsapp: '03014589231',
      email: 'amina.farooq@gmail.com',
      province: 'Punjab',
      city: 'Lahore',
      address: 'House # 42, Block C, Phase 5, DHA',
      notes: 'Please call before delivery. Mehndi event next Friday.',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    paymentMethod: 'Cash on Delivery',
    status: 'Pending Phone Confirmation',
  },
  {
    orderNumber: 'ZJ-98189',
    items: [
      {
        cartItemId: 'zarina-5-Gold-Tone-Standard',
        product: PRODUCTS[4], // Zarina Floral Zircon Cocktail Ring
        quantity: 2,
        selectedColor: 'Gold-Tone with Clear Zircons',
        selectedSize: 'Adjustable',
      },
    ],
    subtotal: 3300,
    shipping: 250,
    total: 3550,
    customer: {
      fullName: 'Dr. Sarah Mansoor',
      phone: '03218845129',
      whatsapp: '03218845129',
      email: 'sarah.mansoor@shifa.pk',
      province: 'Islamabad Capital Territory',
      city: 'Islamabad',
      address: 'Apartment 4B, Silver Oaks, F-10/4',
      notes: 'Please dispatch in safe jewelry gift box.',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    paymentMethod: 'Cash on Delivery',
    status: 'Confirmed',
  },
  {
    orderNumber: 'ZJ-98142',
    items: [
      {
        cartItemId: 'zarina-7-Gold-Tone-Standard',
        product: PRODUCTS[6], // Traditional Kundan Openable Kara
        quantity: 1,
        selectedColor: 'Traditional Gold & Enamel',
        selectedSize: '2.6 (Standard)',
      },
    ],
    subtotal: 2750,
    shipping: 250,
    total: 3000,
    customer: {
      fullName: 'Fatima Bilal',
      phone: '03332456789',
      whatsapp: '03332456789',
      province: 'Sindh',
      city: 'Karachi',
      address: 'B-12, Khayaban-e-Mujahid, Phase 5, Clifton',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), // 22 hours ago
    paymentMethod: 'Cash on Delivery',
    status: 'Dispatched',
  },
  {
    orderNumber: 'ZJ-98075',
    items: [
      {
        cartItemId: 'zarina-2-Silver-Finish-Standard',
        product: PRODUCTS[1], // Minimalist Zircon Solitaire Studs
        quantity: 1,
        selectedColor: 'Silver Finish with Cubic Zirconia',
      },
      {
        cartItemId: 'zarina-4-Rose-Gold-Standard',
        product: PRODUCTS[3], // Delicate Solitaire Zircon Pendant
        quantity: 1,
        selectedColor: 'Rose Gold-Tone',
      },
    ],
    subtotal: 3400,
    shipping: 250,
    total: 3650,
    customer: {
      fullName: 'Zainab Qureshi',
      phone: '03456789123',
      whatsapp: '03456789123',
      email: 'zainab.q@outlook.com',
      province: 'Khyber Pakhtunkhwa',
      city: 'Peshawar',
      address: 'House # 18, University Town, Near Jamrud Road',
      notes: 'Delivered safely via TCS courier. Cash collected.',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    paymentMethod: 'Cash on Delivery',
    status: 'Delivered',
  },
  {
    orderNumber: 'ZJ-97990',
    items: [
      {
        cartItemId: 'zarina-8-Gold-Tone-Standard',
        product: PRODUCTS[7], // Regal Navratan Rani Haar Set
        quantity: 1,
        selectedColor: 'Multi-Stone Navratan Gold Finish',
      },
    ],
    subtotal: 6200,
    shipping: 0,
    total: 6200,
    customer: {
      fullName: 'Huma Tariq',
      phone: '03009988776',
      province: 'Punjab',
      city: 'Faisalabad',
      address: 'Street # 4, Madina Town, Faisalabad',
      notes: 'Customer changed wedding plan, requested cancellation.',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    paymentMethod: 'Cash on Delivery',
    status: 'Cancelled',
  },
  {
    orderNumber: 'ZJ-97912',
    items: [
      {
        cartItemId: 'zarina-6-Gold-Standard',
        product: PRODUCTS[5], // Vintage Mughal Filigree Band
        quantity: 1,
        selectedColor: 'Antique Gold-Tone',
        selectedSize: 'Adjustable',
      },
      {
        cartItemId: 'zarina-10-Silver-Standard',
        product: PRODUCTS[9], // Sleek Cubic Zirconia Tennis Bracelet
        quantity: 1,
        selectedColor: 'Silver Rhodium Finish',
        selectedSize: 'Standard 7 inch',
      },
    ],
    subtotal: 3600,
    shipping: 0,
    total: 3600,
    customer: {
      fullName: 'Areeba Shakeel',
      phone: '03125544332',
      whatsapp: '03125544332',
      email: 'areeba.shakeel@gmail.com',
      province: 'Punjab',
      city: 'Rawalpindi',
      address: 'House # 112, Street 7, Bahria Town Phase 4',
      notes: 'Delivered on time via courier.',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    paymentMethod: 'Cash on Delivery',
    status: 'Delivered',
  },
  {
    orderNumber: 'ZJ-97855',
    items: [
      {
        cartItemId: 'zarina-11-Gold-Standard',
        product: PRODUCTS[10], // Textured Gold-Tone Bangle Cuff
        quantity: 1,
        selectedColor: 'Hammered Gold-Tone',
        selectedSize: 'Standard',
      },
    ],
    subtotal: 1850,
    shipping: 250,
    total: 2100,
    customer: {
      fullName: 'Nida Aslam',
      phone: '03317766554',
      whatsapp: '03317766554',
      province: 'Punjab',
      city: 'Multan',
      address: 'House # 23, Shalimar Colony, Bosan Road',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    paymentMethod: 'Cash on Delivery',
    status: 'Delivered',
  },
  {
    orderNumber: 'ZJ-97810',
    items: [
      {
        cartItemId: 'zarina-4-Rose-Gold-Standard',
        product: PRODUCTS[3], // Delicate Solitaire Zircon Pendant
        quantity: 1,
        selectedColor: 'Rose Gold-Tone',
      },
      {
        cartItemId: 'zarina-2-Silver-Finish-Standard',
        product: PRODUCTS[1], // Minimalist Zircon Studs
        quantity: 1,
        selectedColor: 'Silver Finish with Cubic Zirconia',
      },
    ],
    subtotal: 3400,
    shipping: 250,
    total: 3650,
    customer: {
      fullName: 'Mahnoor Baloch',
      phone: '03229988112',
      whatsapp: '03229988112',
      province: 'Balochistan',
      city: 'Quetta',
      address: 'Bungalow 7, Model Town, Hali Road',
      notes: 'Safe delivery confirmed.',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(), // 6 days ago
    paymentMethod: 'Cash on Delivery',
    status: 'Delivered',
  },
];

export interface DailyOrderVolume {
  date: string;
  dayLabel: string;
  fullDate: string;
  orders: number;
  revenue: number;
}

export function getDailyOrderVolume(orders: Order[]): DailyOrderVolume[] {
  const result: DailyOrderVolume[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);

    const dayOrders = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= d.getTime() && t < nextD.getTime();
    });

    const dayRevenue = dayOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    result.push({
      date: d.toISOString().split('T')[0],
      dayLabel: d.toLocaleDateString('en-PK', { weekday: 'short' }),
      fullDate: d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' }),
      orders: dayOrders.length,
      revenue: dayRevenue,
    });
  }

  return result;
}

const STORAGE_KEYS = {
  AUTH: 'zarina_admin_auth',
  ORDERS: 'zarina_admin_orders',
  PRODUCTS: 'zarina_custom_products',
  SETTINGS: 'zarina_store_settings',
};

// --- AUTHENTICATION ---
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
}

export function setAdminAuthenticated(auth: boolean): void {
  if (typeof window === 'undefined') return;
  if (auth) {
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }
}

// --- ORDERS ---
export function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return INITIAL_SEED_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      // Also check if any orders were saved in checkout history
      const checkoutHistoryRaw = localStorage.getItem('zarina_order_history');
      let combined = [...INITIAL_SEED_ORDERS];
      if (checkoutHistoryRaw) {
        const checkoutOrders: Order[] = JSON.parse(checkoutHistoryRaw);
        const existingNumbers = new Set(combined.map((o) => o.orderNumber));
        for (const order of checkoutOrders) {
          if (!existingNumbers.has(order.orderNumber)) {
            combined.unshift(order);
          }
        }
      }
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(combined));
      return combined;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SEED_ORDERS;
  }
}

export function saveOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  // Dispatch custom event for cross-component sync
  window.dispatchEvent(new Event('zarina_orders_updated'));
}

export function updateOrderStatus(orderNumber: string, newStatus: OrderStatus): void {
  const orders = getStoredOrders();
  const updated = orders.map((order) => {
    if (order.orderNumber === orderNumber) {
      return { ...order, status: newStatus };
    }
    return order;
  });
  saveOrders(updated);
}

export function deleteOrder(orderNumber: string): void {
  const orders = getStoredOrders();
  const filtered = orders.filter((o) => o.orderNumber !== orderNumber);
  saveOrders(filtered);
}

// --- PRODUCTS ---
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(PRODUCTS));
      return PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : PRODUCTS;
  } catch {
    return PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  window.dispatchEvent(new Event('zarina_products_updated'));
}

export function upsertProduct(product: Product): void {
  const current = getStoredProducts();
  const index = current.findIndex((p) => p.id === product.id);
  let updated: Product[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = product;
  } else {
    updated = [product, ...current];
  }
  saveStoredProducts(updated);
}

export function deleteStoredProduct(id: string): void {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== id);
  saveStoredProducts(updated);
}

export function resetProductsToDefault(): void {
  saveStoredProducts(PRODUCTS);
}

// --- SETTINGS ---
export function getStoreSettings(): AdminSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoreSettings(settings: Partial<AdminSettings>): void {
  if (typeof window === 'undefined') return;
  const current = getStoreSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  window.dispatchEvent(new Event('zarina_settings_updated'));
}
