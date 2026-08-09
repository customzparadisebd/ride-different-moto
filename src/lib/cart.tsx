import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/data/types";

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
};

const STORAGE_KEY = "czp-cart";
const MAX_QTY = 20;

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addItem: (product: Product) => void;
  setQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const isCartLine = (value: unknown): value is CartLine => {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line["id"] === "string" &&
    typeof line["slug"] === "string" &&
    typeof line["name"] === "string" &&
    typeof line["image"] === "string" &&
    typeof line["unitPrice"] === "number" &&
    typeof line["qty"] === "number"
  );
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setLines(parsed.filter(isCartLine));
    } catch {
      setLines([]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable — cart stays in memory for this session */
    }
  }, [lines, hydrated]);

  const addItem = useCallback((product: Product) => {
    setLines((current) => {
      const unitPrice = product.offerPrice ?? product.price;
      const existing = current.find((line) => line.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.id === product.id ? { ...line, qty: Math.min(MAX_QTY, line.qty + 1) } : line,
        );
      }
      return [
        ...current,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          unitPrice,
          qty: 1,
        },
      ];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.id === id ? { ...line, qty: Math.max(0, Math.min(MAX_QTY, qty)) } : line,
        )
        .filter((line) => line.qty > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((total, line) => total + line.qty, 0);
    const subtotal = lines.reduce((total, line) => total + line.qty * line.unitPrice, 0);
    return { lines, count, subtotal, addItem, setQty, removeItem, clear };
  }, [lines, addItem, setQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}