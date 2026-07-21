import { Boxes, ShoppingCart, Search, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  icon: LucideIcon;
  label: string;
  match: (pathname: string) => boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", icon: Boxes, label: "Inventário", match: (p) => p === "/" },
  {
    to: "/compras",
    icon: ShoppingCart,
    label: "Compras",
    match: (p) => p.startsWith("/compras"),
  },
  {
    to: "/buscar",
    icon: Search,
    label: "Buscar",
    match: (p) => p.startsWith("/buscar"),
  },
  {
    to: "/configuracoes",
    icon: Settings,
    label: "Ajustes",
    match: (p) => p.startsWith("/configuracoes"),
  },
] as const;
