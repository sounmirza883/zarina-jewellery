import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, CartItem } from '@/types/product';
import { getCartItemId, calculateCartTotals } from '@/lib/shop-logic';
import { siteConfig } from '@/config/site';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  lastAddedItem: CartItem | null;
  toastMessage: string | null;

  // Actions
  addItem: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
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
      lastAddedItem: null,
      toastMessage: null,

      addItem: (product, quantity = 1, selectedColor, selectedSize) => {
        const color = selectedColor || product.colors[0] || 'Default';
        const size = selectedSize || (product.sizes ? product.sizes[0] : undefined);
        const cartItemId = getCartItemId(product.id, color, size);

        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.cartItemId === cartItemId);
          let newItems: CartItem[];
          let newItem: CartItem;

          if (existingIndex > -1) {
            newItems = [...state.items];
            const current = newItems[existingIndex];
            newItem = {
              ...current,
              quantity: current.quantity + quantity,
            };
            newItems[existingIndex] = newItem;
          } else {
            newItem = {
              cartItemId,
              product,
              quantity,
              selectedColor: color,
              selectedSize: size,
            };
            newItems = [...state.items, newItem];
          }

          return {
            items: newItems,
            isDrawerOpen: true,
            lastAddedItem: newItem,
            toastMessage: `Added "${product.name}" to your bag`,
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
              item.cartItemId === cartItemId ? { ...item, quantity } : item
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
      clearToast: () => set({ toastMessage: null }),

      getTotals: () => {
        return calculateCartTotals(
          get().items,
          siteConfig.shipping.flatRate,
          siteConfig.shipping.freeShippingThreshold
        );
      },
    }),
    {
      name: 'zarina_jewels_cart_v1',
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
