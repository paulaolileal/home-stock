import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProductCard } from "@/components/inventory/product-card";
import { useCategories, useProducts, needsShopping } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inventário — Home Inventory" },
      {
        name: "description",
        content: "Seu estoque doméstico em um toque. Aumente ou diminua quantidades sem sair da lista.",
      },
    ],
  }),
  component: Inventario,
});

function Inventario() {
  const products = useProducts();
  const categories = useCategories();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todos");
  const [onlyFav, setOnlyFav] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (category === "Todos" ? true : p.category === category))
      .filter((p) => (onlyFav ? p.favorite : true))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.brand?.toLowerCase().includes(q) ?? false) ||
          p.category.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        // low-stock first, then favorites, then recent
        const la = needsShopping(a) ? 0 : 1;
        const lb = needsShopping(b) ? 0 : 1;
        if (la !== lb) return la - lb;
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [products, query, category, onlyFav]);

  const lowCount = products.filter(needsShopping).length;

  return (
    <AppShell>
      <header className="px-6 pt-12 pb-4">
        <div className="flex items-end justify-between">
          <div className="animate-slide-up">
            <h1 className="text-3xl font-extrabold tracking-tight text-balance">Inventário</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} produtos
              {lowCount > 0 && (
                <>
                  {" • "}
                  <span className="font-semibold text-alert">{lowCount} em falta</span>
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-6 pb-4">
        {/* Search */}
        <div className="relative animate-slide-up [animation-delay:80ms]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar produtos..."
            className="w-full rounded-2xl bg-surface-2 py-3 pl-11 pr-4 text-sm text-foreground ring-1 ring-border outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Filters */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto animate-slide-up [animation-delay:120ms]">
          <button
            onClick={() => setOnlyFav((v) => !v)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition-colors ${
              onlyFav
                ? "bg-alert/10 text-alert ring-alert/20"
                : "bg-surface-2 text-muted-foreground ring-border"
            }`}
          >
            <Star className={`size-3.5 ${onlyFav ? "fill-alert" : ""}`} strokeWidth={2} />
            Favoritos
          </button>
          <FilterPill
            label="Todos"
            active={category === "Todos"}
            onClick={() => setCategory("Todos")}
          />
          {categories.map((c) => (
            <FilterPill
              key={c.id}
              label={c.name}
              active={category === c.name}
              onClick={() => setCategory(c.name)}
            />
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 animate-slide-up [animation-delay:160ms]">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-foreground text-background"
          : "bg-surface-2 text-muted-foreground ring-1 ring-border"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-sm font-medium text-foreground">Nada por aqui</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Ajuste os filtros ou toque em + para adicionar um produto.
      </p>
    </div>
  );
}
