import { useSyncExternalStore } from "react";
import type { Product, Category, Location } from "./types";

const PRODUCTS_KEY = "hi.products";
const CATEGORIES_KEY = "hi.categories";
const LOCATIONS_KEY = "hi.locations";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "c1", name: "Despensa", emoji: "🥫" },
  { id: "c2", name: "Geladeira", emoji: "❄️" },
  { id: "c3", name: "Limpeza", emoji: "🧼" },
  { id: "c4", name: "Higiene", emoji: "🧴" },
  { id: "c5", name: "Bebidas", emoji: "🥤" },
];

const DEFAULT_LOCATIONS: Location[] = [
  { id: "l1", name: "Cozinha" },
  { id: "l2", name: "Despensa" },
  { id: "l3", name: "Banheiro" },
  { id: "l4", name: "Lavanderia" },
];

const seedProducts = (): Product[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "p1",
      name: "Café Tradicional",
      category: "Despensa",
      location: "Cozinha",
      quantity: 1,
      minQuantity: 2,
      idealQuantity: 4,
      unit: "pacotes",
      brand: "Pilão",
      favorite: true,
      updatedAt: now,
    },
    {
      id: "p2",
      name: "Arroz Agulhinha",
      category: "Despensa",
      location: "Despensa",
      quantity: 3,
      minQuantity: 2,
      idealQuantity: 5,
      unit: "unidades",
      brand: "Tio João",
      favorite: false,
      updatedAt: now,
    },
    {
      id: "p3",
      name: "Sabão em Pó",
      category: "Limpeza",
      location: "Lavanderia",
      quantity: 2,
      minQuantity: 1,
      idealQuantity: 2,
      unit: "caixas",
      brand: "Omo",
      favorite: false,
      updatedAt: now,
    },
    {
      id: "p4",
      name: "Leite Integral",
      category: "Geladeira",
      location: "Cozinha",
      quantity: 1,
      minQuantity: 3,
      idealQuantity: 6,
      unit: "caixas",
      favorite: false,
      updatedAt: now,
    },
    {
      id: "p5",
      name: "Papel Higiênico",
      category: "Higiene",
      location: "Banheiro",
      quantity: 4,
      minQuantity: 4,
      idealQuantity: 12,
      unit: "rolos",
      favorite: true,
      updatedAt: now,
    },
  ];
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  notify();
}

// Simple pub-sub for React sync
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(seedProducts()));
  }
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(LOCATIONS_KEY)) {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(DEFAULT_LOCATIONS));
  }
}

export function useProducts(): Product[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureSeed();
      return read<Product[]>(PRODUCTS_KEY, []);
    },
    () => [],
  );
}

export function useCategories(): Category[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureSeed();
      return read<Category[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    },
    () => DEFAULT_CATEGORIES,
  );
}

export function useLocations(): Location[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureSeed();
      return read<Location[]>(LOCATIONS_KEY, DEFAULT_LOCATIONS);
    },
    () => DEFAULT_LOCATIONS,
  );
}

function getProducts() {
  ensureSeed();
  return read<Product[]>(PRODUCTS_KEY, []);
}

export function updateProduct(id: string, patch: Partial<Product>) {
  const list = getProducts();
  const next = list.map((p) =>
    p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
  );
  write(PRODUCTS_KEY, next);
}

export function upsertProduct(p: Product) {
  const list = getProducts();
  const idx = list.findIndex((x) => x.id === p.id);
  const stamped = { ...p, updatedAt: new Date().toISOString() };
  const next = idx >= 0 ? list.map((x, i) => (i === idx ? stamped : x)) : [stamped, ...list];
  write(PRODUCTS_KEY, next);
}

export function removeProduct(id: string) {
  write(
    PRODUCTS_KEY,
    getProducts().filter((p) => p.id !== id),
  );
}

export function incrementProduct(id: string, delta: number) {
  const list = getProducts();
  const next = list.map((p) => {
    if (p.id !== id) return p;
    const q = Math.max(0, p.quantity + delta);
    return { ...p, quantity: q, updatedAt: new Date().toISOString() };
  });
  write(PRODUCTS_KEY, next);
}

export function toggleFavorite(id: string) {
  const list = getProducts();
  write(
    PRODUCTS_KEY,
    list.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)),
  );
}

export function setInCart(id: string, inCart: boolean) {
  const list = getProducts();
  write(
    PRODUCTS_KEY,
    list.map((p) => (p.id === id ? { ...p, inCart } : p)),
  );
}

export function newId() {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

export function addCategory(name: string) {
  const list = read<Category[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
  if (list.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
  write(CATEGORIES_KEY, [...list, { id: `c_${Date.now()}`, name }]);
}

export function removeCategory(id: string) {
  const list = read<Category[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
  write(
    CATEGORIES_KEY,
    list.filter((c) => c.id !== id),
  );
}

export function addLocation(name: string) {
  const list = read<Location[]>(LOCATIONS_KEY, DEFAULT_LOCATIONS);
  if (list.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
  write(LOCATIONS_KEY, [...list, { id: `l_${Date.now()}`, name }]);
}

export function removeLocation(id: string) {
  const list = read<Location[]>(LOCATIONS_KEY, DEFAULT_LOCATIONS);
  write(
    LOCATIONS_KEY,
    list.filter((c) => c.id !== id),
  );
}

// Derived
export function needsShopping(p: Product) {
  return p.quantity < p.minQuantity;
}

export function shortageQty(p: Product) {
  return Math.max(0, p.idealQuantity - p.quantity);
}
