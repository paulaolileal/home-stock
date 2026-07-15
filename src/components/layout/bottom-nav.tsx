import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, ShoppingCart, Plus, Search, Settings } from "lucide-react";

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", icon: Boxes, label: "Inventário", match: (p: string) => p === "/" },
    {
      to: "/compras",
      icon: ShoppingCart,
      label: "Compras",
      match: (p: string) => p.startsWith("/compras"),
    },
    {
      to: "/buscar",
      icon: Search,
      label: "Buscar",
      match: (p: string) => p.startsWith("/buscar"),
    },
    {
      to: "/configuracoes",
      icon: Settings,
      label: "Ajustes",
      match: (p: string) => p.startsWith("/configuracoes"),
    },
  ] as const;

  return (
    <>
      <nav
        aria-label="Navegação"
        className="fixed bottom-4 left-1/2 z-40 flex h-16 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-full border border-border/60 bg-card/85 px-2 shadow-[var(--shadow-pop)] backdrop-blur-xl"
      >
        {items.slice(0, 2).map((it) => {
          const active = it.match(path);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              aria-label={it.label}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 transition-colors ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-semibold tracking-wide">{it.label}</span>
            </Link>
          );
        })}
        <Link
          to="/adicionar"
          aria-label="Adicionar produto"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-pop)] transition-transform active:scale-90"
        >
          <Plus className="size-6" strokeWidth={2.4} />
        </Link>
        {items.slice(2).map((it) => {
          const active = it.match(path);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              aria-label={it.label}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 transition-colors ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-semibold tracking-wide">{it.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* spacer so content doesn't hide under nav */}
      <div aria-hidden className="h-28" />
    </>
  );
}
