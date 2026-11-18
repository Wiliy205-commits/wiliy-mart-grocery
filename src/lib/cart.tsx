import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  unit: string | null;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "wiliy-mart-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore corrupt cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback<CartContextValue["add"]>((item, quantity = 1) => {
    if (item.stock <= 0) {
      toast.error("Stok produk habis");
      return;
    }
    let capped = false;
    setItems((prev) => {
      const existing = prev.find((p) => p.productId === item.productId);
      const nextQty = Math.min(item.stock, (existing?.quantity ?? 0) + quantity);
      capped = nextQty < (existing?.quantity ?? 0) + quantity;
      if (existing) return prev.map((p) => (p.productId === item.productId ? { ...p, ...item, quantity: nextQty } : p));
      return [...prev, { ...item, quantity: nextQty }];
    });
    if (capped) toast.warning(`Jumlah disesuaikan dengan stok tersedia (${item.stock})`);
    else toast.success(`${item.name} ditambahkan ke keranjang`);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.productId === productId ? { ...p, quantity: Math.max(0, Math.min(p.stock, quantity)) } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return { items, count, subtotal, hydrated, add, setQuantity, remove, clear };
  }, [items, hydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
