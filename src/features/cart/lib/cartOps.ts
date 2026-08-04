import type { CartItem } from "../model/types";

export function addToCart(items: CartItem[], item: Omit<CartItem, "qty">, qty = 1): CartItem[] {
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) return items.map((i, k) => (k === idx ? { ...i, qty: i.qty + qty } : i));
  return [...items, { ...item, qty }];
}

export function updateQty(items: CartItem[], id: string, qty: number): CartItem[] {
  return items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
}

export function removeFromCart(items: CartItem[], id: string): CartItem[] {
  return items.filter((i) => i.id !== id);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
