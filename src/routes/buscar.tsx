import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProductCard } from "@/components/inventory/product-card";
import { useProducts } from "@/lib/store";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar — Home Inventory" },
      { name: "description", content: "Encontre qualquer produto do seu inventário." },
    ],
  }),
  component: Buscar,
});

function Buscar() {
  const [q, setQ] = useState("");
  const products = useProducts();
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.brand?.toLowerCase().includes(s) ?? false) ||
        p.category.toLowerCase().includes(s) ||
        p.location.toLowerCase().includes(s),
    );
  }, [q, products]);

  return (
    <AppShell>
      <header className="px-6 pt-12 pb-4">
        <h1 className="animate-slide-up text-3xl font-extrabold tracking-tight">Buscar</h1>
      </header>
      <div className="space-y-4 px-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Café, arroz, papel..."
            className="w-full rounded-2xl bg-surface-2 py-3 pl-11 pr-4 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {q && results.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-sm font-medium">Nada encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tente outro termo ou adicione o produto.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
