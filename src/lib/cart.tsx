// ============================================================
// CART WITH PRODUCT VARIATIONS & FLASH SALES
// Purpose: Local cart that keeps the selected colour variation,
//          its variation price, and flash sale context attached to every line.
// Status: COMPLETED
// Security: Display only. Prices are re-resolved server-side at
//          checkout, so a tampered cart cannot change what is charged.
// ============================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { colorPrice, type StorefrontColor, type StorefrontProduct } from "@/lib/storefront.shared";

export type CartLine = {
  /** Unique per product + colour, so two colours of one product are separate lines. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  colorId: string | null;
  colorName: string | null;
  unitPrice: number;
  qty: number;
  flashSaleId?: string | null;
};

const STORAGE_KEY = "czp-cart-v3"; // Incremented version for flash sales
const MAX_QTY = 20;

export const cartLineKey = (productId: string, colorId?: string | null, flashSaleId?: string | null) =>
  `${productId}::${colorId ?? ""}::${flashSaleId ?? ""}`;

type AddItemInput = {
  product: StorefrontProduct;
  color?: StorefrontColor | null;
  qty?: number;
  flashSaleId?: string | null;
  unitPrice?: number; // Optional override for flash sale price
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addItem: (input: AddItemInput) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const isCartLine = (value: unknown): value is CartLine => {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line["key"] === "string" &&
    typeof line["productId"] === "string" &&
    typeof line["name"] === "string" &&
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

  const addItem = useCallback(({ product, color, qty = 1, flashSaleId, unitPrice }: AddItemInput) => {
    const key = cartLineKey(product.id, color?.id ?? null, flashSaleId);
    setLines((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, qty: Math.min(MAX_QTY, line.qty + qty) } : line,
        );
      }
      return [
        ...current,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: color?.image ?? product.image ?? "",
          colorId: color?.id ?? null,
          colorName: color?.name ?? null,
          unitPrice: unitPrice ?? colorPrice(product, color),
          qty: Math.min(MAX_QTY, Math.max(1, qty)),
          flashSaleId: flashSaleId ?? null,
        },
      ];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.key === key ? { ...line, qty: Math.max(0, Math.min(MAX_QTY, qty)) } : line,
        )
        .filter((line) => line.qty > 0),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
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
