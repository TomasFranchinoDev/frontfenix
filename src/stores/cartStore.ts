import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItemVariants = Record<string, string | number | boolean>;

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
};

export type CartItem = {
  id: string;
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  variantes: CartItemVariants;
  imagen_url?: string;
};

type AddCartItemInput = {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad?: number;
  variantes?: CartItemVariants;
  imagen_url?: string;
};

type CartState = {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  toOrderItems: () => Array<{
    producto_id: string;
    cantidad: number;
    variantes: CartItemVariants;
  }>;
};

function serializeVariants(variantes: CartItemVariants): string {
  const sortedEntries = Object.entries(variantes).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(sortedEntries);
}

function createCartItemId(productoId: string, variantes: CartItemVariants): string {
  return `${productoId}::${serializeVariants(variantes)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
      addItem: (item) => {
        const variantes = item.variantes ?? {};
        const cantidad = item.cantidad ?? 1;
        const id = createCartItemId(item.producto_id, variantes);

        set((state) => {
          const existingItem = state.items.find((cartItem) => cartItem.id === id);

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === id
                  ? { ...cartItem, cantidad: cartItem.cantidad + Math.max(1, cantidad) }
                  : cartItem,
              ),
            };
          }

          const newItem: CartItem = {
            id,
            producto_id: item.producto_id,
            nombre: item.nombre,
            precio_unitario: item.precio_unitario,
            cantidad: Math.max(1, cantidad),
            variantes,
            imagen_url: item.imagen_url,
          };

          return {
            items: [...state.items, newItem],
          };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      updateQuantity: (id, cantidad) => {
        if (cantidad <= 0) {
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));
          return;
        }

        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, cantidad } : item)),
        }));
      },
      clearCart: () => {
        set({ items: [] });
      },
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0);
      },
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.precio_unitario * item.cantidad, 0);
      },
      toOrderItems: () => {
        return get().items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          variantes: item.variantes,
        }));
      },
    }),
    {
      name: "fenix-cart-store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : noopStorage)),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
      onRehydrateStorage: () => (state, error) => {
        state?.setHasHydrated(true);
        if (error) {
          state?.setHasHydrated(true);
        }
      },
    },
  ),
);
