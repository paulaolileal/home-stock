import { Link } from "@tanstack/react-router";
import { Minus, Plus, Star } from "lucide-react";
import { incrementProduct, needsShopping, toggleFavorite } from "@/lib/store";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const low = needsShopping(product);

  return (
    <Link
      to="/produto/$id"
      params={{ id: product.id }}
      className="group block rounded-3xl bg-card p-4 shadow-[var(--shadow-soft)] ring-1 ring-border transition-all active:scale-[0.99]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-card-foreground">{product.name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {product.location} • {product.category}
            {product.brand ? ` • ${product.brand}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {low && (
            <span className="rounded-full bg-alert/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-alert">
              Baixo
            </span>
          )}
          <button
            type="button"
            aria-label={product.favorite ? "Remover dos favoritos" : "Favoritar"}
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(product.id);
            }}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <Star
              className={`size-4 ${product.favorite ? "fill-alert text-alert" : ""}`}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1 font-mono text-sm">
          <span className={`font-bold ${low ? "text-alert" : "text-foreground"}`}>
            {product.quantity}
          </span>
          <span className="text-muted-foreground">/ {product.idealQuantity}</span>
          <span className="ml-1 text-xs text-muted-foreground">{product.unit}</span>
        </div>

        <div
          className="flex items-center rounded-xl bg-surface-2 p-1 ring-1 ring-border"
          onClick={(e) => e.preventDefault()}
        >
          <button
            type="button"
            aria-label="Diminuir"
            onClick={(e) => {
              e.preventDefault();
              incrementProduct(product.id, -1);
            }}
            disabled={product.quantity <= 0}
            className="grid size-9 place-items-center rounded-lg text-foreground transition-transform active:scale-90 disabled:opacity-40"
          >
            <Minus className="size-4" strokeWidth={2.5} />
          </button>
          <div className="w-9 text-center font-mono text-sm font-bold tabular-nums">
            {product.quantity}
          </div>
          <button
            type="button"
            aria-label="Aumentar"
            onClick={(e) => {
              e.preventDefault();
              incrementProduct(product.id, 1);
            }}
            className="grid size-9 place-items-center rounded-lg bg-foreground text-background transition-transform active:scale-90"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Link>
  );
}
