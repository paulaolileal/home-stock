import { useRef, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { incrementProduct, setInCart } from "@/lib/store";
import type { Product } from "@/lib/types";

const THRESHOLD = 80;

export function ShoppingRow({ product }: { product: Product }) {
  const inCart = !!product.inCart;
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
      setInCart(product.id, true);
      if (navigator.vibrate) navigator.vibrate(10);
    } else if (inCart && dragX < -THRESHOLD) {
      setInCart(product.id, false);
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
          onClick={() => setInCart(product.id, !inCart)}
          className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-all ${
            inCart ? "border-accent bg-accent text-accent-foreground" : "border-border bg-transparent"
          }`}
        >
          {inCart && <Check className="size-4" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-semibold ${
              inCart ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {product.name}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {product.location} • falta {Math.max(0, product.idealQuantity - product.quantity)}{" "}
            {product.unit}
          </p>
        </div>

        <div className="flex items-center rounded-lg bg-surface-2 p-0.5 ring-1 ring-border">
          <button
            type="button"
            aria-label="Diminuir"
            onClick={() => incrementProduct(product.id, -1)}
            disabled={product.quantity <= 0}
            className="grid size-8 place-items-center rounded-md active:scale-90 disabled:opacity-40"
          >
            <Minus className="size-3.5" strokeWidth={2.5} />
          </button>
          <span className="w-8 text-center font-mono text-xs font-bold tabular-nums">
            {product.quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar"
            onClick={() => incrementProduct(product.id, 1)}
            className="grid size-8 place-items-center rounded-md bg-foreground text-background active:scale-90"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
