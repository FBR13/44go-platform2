'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = '44go-cart-v1';

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  price: number;
  image_url: string | null;
  size: string | null;
  quantity: number;
};

export function lineKey(productId: string, size: string | null): string {
  return `${productId}::${size ?? ''}`;
}

type CartContextValue = {
  lines: CartLine[];
  totalItems: number;
  subtotal: number;
  addItem: (
    item: Omit<CartLine, 'key' | 'quantity'> & { quantity?: number },
  ) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadLines(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(loadLines());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const addItem = useCallback(
    (item: Omit<CartLine, 'key' | 'quantity'> & { quantity?: number }) => {
      const key = lineKey(item.productId, item.size);
      const qty = item.quantity ?? 1;
      setLines((prev) => {
        const i = prev.findIndex((l) => l.key === key);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], quantity: next[i].quantity + qty };
          return next;
        }
        return [...prev, { ...item, key, quantity: qty }];
      });
    },
    [],
  );

  const removeItem = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    const q = Math.max(0, Math.floor(quantity));
    setLines((prev) => {
      if (q === 0) return prev.filter((l) => l.key !== key);
      return prev.map((l) =>
        l.key === key ? { ...l, quantity: q } : l,
      );
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const totalItems = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clear,
    }),
    [
      lines,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }
  return ctx;
}
