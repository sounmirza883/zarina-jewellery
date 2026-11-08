import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, ProductVariant, CartItem } from '@/types/product';
import { calculateCartTotals, maxQuantity, MAX_PER_ITEM } from '@/lib/shop-logic';
import { variantLabel, variantPrice } from '@/lib/pricing';
import { siteConfig } from '@/config/site';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  isMobileMenuOpen: boolean;
  lastAddedItem: CartItem | null;
  toastMessage: string | null;
  // Admin-controlled shipping rules; hydrated from the server (see SettingsHydrator). Not persisted.
  shipping: { flatRate: number; freeShippingThreshold: number };

  // Actions
  setShipping: (flatRate: number, freeShippingThreshold: number) => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  clearToast: () => void;

  // Computed helpers
  getTotals: () => {
    subtotal: number;
    shipping: number;
    total: number;
    freeShippingRemaining: number;
    isFreeShipping: boolean;
    totalItemCount: number;
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      isMobileMenuOpen: false,
      lastAddedItem: null,
      toastMessage: null,
      shipping: {
        flatRate: siteConfig.shipping.flatRate,
        freeShippingThreshold: siteConfig.shipping.freeShippingThreshold,
      },

      setShipping: (flatRate, freeShippingThreshold) =>
        set({ shipping: { flatRate, freeShippingThreshold } }),

      addItem: (product, variant, quantity = 1) => {
        if (variant.stockQty <= 0) {
          set({ toastMessage: `"${product.name}" is out of stock` });
          return;
        }

        set((state) => {
          const existing = state.items.find((item) => item.cartItemId === variant.id);
          const wanted = (existing?.quantity ?? 0) + quantity;
          const capped = Math.min(wanted, variant.stockQty, MAX_PER_ITEM);

          const newItem: CartItem = existing
            ? { ...existing, quantity: capped }
            : {
                cartItemId: variant.id,
                variantId: variant.id,
                sku: variant.sku ?? undefined,
                variantLabel: variantLabel(variant),
                unitPrice: variantPrice(variant),
                product,
                quantity: capped,
                selectedColor: variant.color,
                selectedSize: variant.size || undefined,
              };

          return {
            items: existing
              ? state.items.map((item) => (item === existing ? newItem : item))
              : [...state.items, newItem],
            isDrawerOpen: true,
            lastAddedItem: newItem,
            toastMessage:
              capped < wanted
                ? `Only ${capped} available for "${product.name}"`
                : `Added "${product.name}" to your bag`,
          };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => {
          const removed = state.items.find((i) => i.cartItemId === cartItemId);
          return {
            items: state.items.filter((item) => item.cartItemId !== cartItemId),
            toastMessage: removed ? `Removed "${removed.product.name}"` : null,
          };
        });
      },

      updateQuantity: (cartItemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.cartItemId !== cartItemId),
            };
          }
          return {
            items: state.items.map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: Math.min(quantity, maxQuantity(item)) }
                : item
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [], lastAddedItem: null });
      },

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      openMobileMenu: () => set({ isMobileMenuOpen: true }),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      clearToast: () => set({ toastMessage: null }),

      getTotals: () => {
        const { items, shipping } = get();
        return calculateCartTotals(items, shipping.flatRate, shipping.freeShippingThreshold);
      },
    }),
    {
      name: 'zarina_jewels_cart_v1',
      // Version 2 keys bag lines by variant id; bags saved before that cannot be converted, so they are dropped once.
      version: 2,
      migrate: (persisted, version) =>
        version < 2 ? { items: [] } : (persisted as { items: CartItem[] }),
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // SSR safe fallback dummy storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
