import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, size: string, color: string) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, selectedSize, selectedColor) => {
        const existing = get().items.find(
          (i) =>
            i.product.id === product.id &&
            i.selectedSize === selectedSize &&
            i.selectedColor === selectedColor
        );
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === product.id &&
              i.selectedSize === selectedSize &&
              i.selectedColor === selectedColor
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          }));
        } else {
          set((s) => ({
            items: [...s.items, { product, quantity, selectedSize, selectedColor }],
          }));
        }
      },

      removeItem: (productId, size, color) => {
        set((s) => ({
          items: s.items.filter(
            (i) =>
              !(i.product.id === productId && i.selectedSize === size && i.selectedColor === color)
          ),
        }));
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.product.id === productId && i.selectedSize === size && i.selectedColor === color
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'tunmise-cart' }
  )
);
