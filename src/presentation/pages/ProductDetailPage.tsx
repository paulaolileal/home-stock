import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCategories,
  useDeleteProduct,
  useIncrementProduct,
  useLocations,
  useProducts,
  useToggleFavorite,
  useUpdateProduct,
} from "@/hooks/queries";

export function ProductDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const incrementProduct = useIncrementProduct();
  const toggleFavorite = useToggleFavorite();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const [editing, setEditing] = useState(false);

  if (!product) {
    return (
      <div className="px-6 pt-16 text-center">
        <p className="text-sm text-muted-foreground">Produto não encontrado.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          Voltar
        </button>
      </div>
    );
  }

  const low = product.quantity < product.minQuantity;

  return (
    <>
      <header className="flex items-center justify-between px-6 pt-12 pb-4">
        <button
          onClick={() => navigate("/")}
          className="inline-flex size-9 items-center justify-center rounded-full bg-surface-2 ring-1 ring-border"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-4" strokeWidth={2.4} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => toggleFavorite.mutate(product)}
            aria-label="Favoritar"
            className="inline-flex size-9 items-center justify-center rounded-full bg-surface-2 ring-1 ring-border"
          >
            <Star
              className={`size-4 ${product.favorite ? "fill-alert text-alert" : ""}`}
              strokeWidth={2}
            />
          </button>
          <button
            onClick={() => {
              if (confirm("Excluir este produto?")) {
                deleteProduct.mutate(product.id, {
                  onSuccess: () => {
                    toast.success("Produto excluído");
                    navigate("/");
                  },
                });
              }
            }}
            aria-label="Excluir"
            className="inline-flex size-9 items-center justify-center rounded-full bg-surface-2 text-destructive ring-1 ring-border"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="px-6 pb-4 space-y-4 animate-slide-up">
        <div>
          {low && (
            <span className="inline-block rounded-full bg-alert/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-alert">
              Baixo estoque
            </span>
          )}
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-balance">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.location} • {product.category}
            {product.brand ? ` • ${product.brand}` : ""}
          </p>
        </div>

        {/* Big stepper */}
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => incrementProduct(product.id, -1)}
              disabled={product.quantity <= 0}
              aria-label="Diminuir"
              className="grid size-14 place-items-center rounded-2xl bg-surface-2 ring-1 ring-border transition-transform active:scale-90 disabled:opacity-40"
            >
              <Minus className="size-5" strokeWidth={2.5} />
            </button>
            <div className="text-center">
              <p className="font-mono text-5xl font-extrabold tabular-nums">{product.quantity}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                de {product.idealQuantity} {product.unit}
              </p>
            </div>
            <button
              onClick={() => incrementProduct(product.id, 1)}
              aria-label="Aumentar"
              className="grid size-14 place-items-center rounded-2xl bg-foreground text-background transition-transform active:scale-90"
            >
              <Plus className="size-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Editing */}
        <button
          onClick={() => setEditing((v) => !v)}
          className="w-full rounded-2xl bg-surface-2 py-3 text-sm font-bold text-foreground ring-1 ring-border"
        >
          {editing ? "Ocultar detalhes" : "Editar detalhes"}
        </button>

        {editing && (
          <div className="space-y-3 rounded-3xl bg-card p-5 ring-1 ring-border">
            <Row label="Categoria">
              <select
                value={product.category}
                onChange={(e) =>
                  updateProduct.mutate({ id: product.id, patch: { category: e.target.value } })
                }
                className="bg-transparent text-sm font-semibold outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Local">
              <select
                value={product.location}
                onChange={(e) =>
                  updateProduct.mutate({ id: product.id, patch: { location: e.target.value } })
                }
                className="bg-transparent text-sm font-semibold outline-none"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Mínimo">
              <input
                type="number"
                min={0}
                value={product.minQuantity}
                onChange={(e) =>
                  updateProduct.mutate({
                    id: product.id,
                    patch: { minQuantity: Math.max(0, Number(e.target.value)) },
                  })
                }
                className="w-16 bg-transparent text-right font-mono text-sm font-bold outline-none"
              />
            </Row>
            <Row label="Ideal">
              <input
                type="number"
                min={0}
                value={product.idealQuantity}
                onChange={(e) =>
                  updateProduct.mutate({
                    id: product.id,
                    patch: { idealQuantity: Math.max(0, Number(e.target.value)) },
                  })
                }
                className="w-16 bg-transparent text-right font-mono text-sm font-bold outline-none"
              />
            </Row>
            <Row label="Unidade">
              <input
                value={product.unit}
                onChange={(e) =>
                  updateProduct.mutate({ id: product.id, patch: { unit: e.target.value } })
                }
                className="w-28 bg-transparent text-right text-sm font-semibold outline-none"
              />
            </Row>
            <Row label="Marca">
              <input
                value={product.brand ?? ""}
                onChange={(e) =>
                  updateProduct.mutate({ id: product.id, patch: { brand: e.target.value } })
                }
                placeholder="—"
                className="w-32 bg-transparent text-right text-sm font-semibold outline-none placeholder:text-muted-foreground"
              />
            </Row>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 ring-1 ring-border">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
