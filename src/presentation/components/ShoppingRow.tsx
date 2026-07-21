import { useRef, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { needsShopping, useLocations, useSetInCart } from "@/hooks/queries";
import { useShoppingListStore } from "@/store/shoppingListStore";
import { resolveName } from "@/domain/lookup";
import { formatLocation } from "@/lib/locationFormat";
import type { Product } from "@/domain/types";

const THRESHOLD = 80;

export function ShoppingRow({ product }: { product: Product }) {
  const inCart = !!product.inCart;
  const setInCart = useSetInCart();
  const isLow = needsShopping(product);
  const { data: locations = [] } = useLocations();
  const missing = Math.max(0, product.idealQuantity - product.quantity);

  const storedTarget = useShoppingListStore((s) => s.targetQuantities[product.id]);
  const setTarget = useShoppingListStore((s) => s.setTarget);
  const clearTarget = useShoppingListStore((s) => s.clearTarget);
  const target = storedTarget ?? missing;

  const confirmPurchase = () => {
    setInCart.mutate({
      id: product.id,
      inCart: true,
      quantity: product.quantity + target,
      wanted: false,
    });
    clearTarget(product.id);
  };

  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const onStart = (x: number) => {
    startX.current = x;
  };
  const onMove = (x: number) => {
    if (startX.current == null) return;
    const dx = x - startX.current;
    // Only allow relevant direction
    if (inCart) setDragX(Math.min(0, Math.max(dx, -120)));
    else setDragX(Math.max(0, Math.min(dx, 120)));
  };
  const onEnd = () => {
    if (startX.current == null) return;
    if (!inCart && dragX > THRESHOLD) {
      confirmPurchase();
      if (navigator.vibrate) navigator.vibrate(10);
    } else if (inCart && dragX < -THRESHOLD) {
      setInCart.mutate({ id: product.id, inCart: false });
      if (navigator.vibrate) navigator.vibrate(10);
    }
    setDragX(0);
    startX.current = null;
  };

  const revealSide = inCart ? "right" : "left";
  const revealLabel = inCart ? "Voltar" : "No carrinho";

  return (
    <div
      ref={wrapRef}
      className="relative select-none overflow-hidden rounded-2xl"
      onTouchStart={(e) => onStart(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={onEnd}
      onMouseDown={(e) => onStart(e.clientX)}
      onMouseMove={(e) => {
        if (startX.current != null) onMove(e.clientX);
      }}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
    >
      {/* Reveal background */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center px-6 ${
          revealSide === "left" ? "justify-start bg-accent" : "justify-end bg-muted"
        }`}
      >
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            revealSide === "left" ? "text-accent-foreground" : "text-muted-foreground"
          }`}
        >
          {revealLabel}
        </span>
      </div>

      {/* Foreground row */}
      <div
        style={{ transform: `translateX(${dragX}px)` }}
        className={`relative flex h-16 items-center gap-3 rounded-2xl px-4 ring-1 ring-border transition-transform duration-200 ${
          inCart ? "bg-surface-2" : "bg-card shadow-[var(--shadow-soft)]"
        }`}
      >
        <button
          type="button"
          aria-label={inCart ? "Remover do carrinho" : "Marcar como comprado"}
          onClick={() =>
            inCart ? setInCart.mutate({ id: product.id, inCart: false }) : confirmPurchase()
          }
          className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-all ${
            inCart
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-transparent"
          }`}
        >
          {inCart && <Check className="size-4" strokeWidth={3} />}
        </button>

        {product.image && (
          <img
            src={product.image}
            alt=""
            className="size-9 shrink-0 rounded-[10px] bg-surface-2 object-contain p-1 ring-1 ring-border"
          />
        )}

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-semibold ${
              inCart ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {product.name}
          </p>
          {product.notes && (
            <p className="truncate text-[10px] italic text-muted-foreground">({product.notes})</p>
          )}
          <p className="truncate text-[10px] text-muted-foreground">
            {formatLocation(resolveName(locations, product.locationId))} • tem {product.quantity}{" "}
            {product.unit}
            {isLow && " • em baixa"}
          </p>
        </div>

        <div className="flex items-center rounded-lg bg-surface-2 p-0.5 ring-1 ring-border">
          <button
            type="button"
            aria-label="Diminuir quantidade a comprar"
            onClick={() => setTarget(product.id, Math.max(0, target - 1))}
            disabled={target <= 0}
            className="grid size-8 place-items-center rounded-md active:scale-90 disabled:opacity-40"
          >
            <Minus className="size-3.5" strokeWidth={2.5} />
          </button>
          <span className="w-8 text-center font-mono text-xs font-bold tabular-nums">{target}</span>
          <button
            type="button"
            aria-label="Aumentar quantidade a comprar"
            onClick={() => setTarget(product.id, target + 1)}
            className="grid size-8 place-items-center rounded-md bg-foreground text-background active:scale-90"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
