"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addToCart, updateQty, removeFromCart, cartCount, cartSubtotal } from "../lib/cartOps";
import type { CartItem } from "./types";

const STORAGE_KEY = "zipboda-cart";

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* noop */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      add: (item, qty = 1) => {
        setItems((prev) => addToCart(prev, item, qty));
        setIsOpen(true);
      },
      remove: (id) => setItems((prev) => removeFromCart(prev, id)),
      setQty: (id, qty) => setItems((prev) => updateQty(prev, id, qty)),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false)
    }),
    [items, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
