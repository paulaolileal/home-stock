import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { ProductCard } from "@/presentation/components/ProductCard";
import { useCategories, useIncrementProduct, useLocations, useProducts } from "@/hooks/queries";
import { resolveName } from "@/domain/lookup";

export function SearchPage() {
  const [q, setQ] = useState("");
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const incrementProduct = useIncrementProduct();
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.notes?.toLowerCase().includes(s) ?? false) ||
        resolveName(categories, p.categoryId).toLowerCase().includes(s) ||
        resolveName(locations, p.locationId).toLowerCase().includes(s),
    );
  }, [q, products, categories, locations]);

  return (
    <>
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
            <ProductCard key={p.id} product={p} onIncrement={incrementProduct} />
          ))}
        </div>
      </div>
    </>
  );
}
