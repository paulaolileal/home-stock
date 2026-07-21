import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Trash2 } from "lucide-react";
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
import { useToggleWanted } from "@/hooks/useToggleWanted";
import { COMMON_UNITS } from "@/domain/units";
import { resolveName, withEmoji } from "@/domain/lookup";
import { formatLocation } from "@/lib/locationFormat";
import { LocationSelectItems } from "@/presentation/components/LocationSelectItems";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ProductDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const incrementProduct = useIncrementProduct();
  const toggleFavorite = useToggleFavorite();
  const toggleWanted = useToggleWanted();
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
            onClick={() => toggleWanted(product)}
            aria-label={
              product.wanted ? "Remover da lista de compras" : "Adicionar à lista de compras"
            }
            className={`inline-flex size-9 items-center justify-center rounded-full ring-1 ring-border ${
              product.wanted ? "bg-accent/10 text-accent" : "bg-surface-2"
            }`}
          >
            <ShoppingCart
              className={`size-4 ${product.wanted ? "fill-accent/20" : ""}`}
              strokeWidth={2}
            />
          </button>
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
        <div className="lg:flex lg:items-start lg:gap-8">
          {product.image && (
            <div className="flex justify-center lg:shrink-0">
              <img
                src={product.image}
                alt=""
                className="h-48 w-48 rounded-3xl bg-surface-2 object-contain p-4 ring-1 ring-border"
              />
            </div>
          )}
          <div className="min-w-0 lg:flex-1">
            {low && (
              <span className="inline-block rounded-full bg-alert/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-alert">
                Baixo estoque
              </span>
            )}
            {!low && product.wanted && (
              <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                Na lista de compras
              </span>
            )}
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-balance">
              {product.name}
            </h1>
            {product.notes && (
              <p className="mt-1 text-sm italic text-muted-foreground">({product.notes})</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {formatLocation(resolveName(locations, product.locationId))} •{" "}
              {resolveName(categories, product.categoryId)}
            </p>
          </div>
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
              <Select
                value={product.categoryId}
                onValueChange={(v) =>
                  updateProduct.mutate({ id: product.id, patch: { categoryId: v } })
                }
              >
                <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {withEmoji(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Local">
              <Select
                value={product.locationId}
                onValueChange={(v) =>
                  updateProduct.mutate({ id: product.id, patch: { locationId: v } })
                }
              >
                <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <LocationSelectItems locations={locations} />
                </SelectContent>
              </Select>
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
              <Select
                value={product.unit}
                onValueChange={(v) => updateProduct.mutate({ id: product.id, patch: { unit: v } })}
              >
                <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(COMMON_UNITS as readonly string[]).includes(product.unit) ? null : (
                    <SelectItem value={product.unit}>{product.unit}</SelectItem>
                  )}
                  {COMMON_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            <label className="block rounded-xl bg-surface-2 px-4 py-3 ring-1 ring-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Imagem (URL)
              </span>
              <div className="mt-1 flex items-center gap-3">
                <input
                  defaultValue={product.image ?? ""}
                  onBlur={(e) =>
                    updateProduct.mutate({
                      id: product.id,
                      patch: { image: e.target.value.trim() || undefined },
                    })
                  }
                  placeholder="https://..."
                  className="w-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
                />
                {product.image && (
                  <img
                    src={product.image}
                    alt=""
                    className="size-9 shrink-0 rounded-[10px] bg-surface-2 object-contain p-1 ring-1 ring-border"
                  />
                )}
              </div>
            </label>

            <label className="block rounded-xl bg-surface-2 px-4 py-3 ring-1 ring-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </span>
              <Textarea
                defaultValue={product.notes ?? ""}
                onBlur={(e) =>
                  updateProduct.mutate({
                    id: product.id,
                    patch: { notes: e.target.value.trim() || undefined },
                  })
                }
                placeholder="—"
                rows={2}
                className="mt-1 w-full resize-none border-0 bg-transparent p-0 text-sm font-semibold shadow-none outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </label>
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
