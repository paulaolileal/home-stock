import { useMemo } from "react";
import { PartyPopper } from "lucide-react";
import { ShoppingRow } from "@/presentation/components/ShoppingRow";
import { needsShopping, useProducts } from "@/hooks/queries";

export function ShoppingListPage() {
  const { data: products = [] } = useProducts();

  const list = useMemo(
    () => products.filter((p) => needsShopping(p) || p.wanted || p.inCart),
    [products],
  );
  const remaining = list.filter((p) => !p.inCart);
  const inCart = list.filter((p) => p.inCart);
  const total = list.length;
  const progress = total === 0 ? 0 : Math.round((inCart.length / total) * 100);
  const done = total > 0 && remaining.length === 0;

  return (
    <>
      <header className="px-6 pt-12 pb-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="animate-slide-up text-3xl font-extrabold tracking-tight">Compras</h1>
          <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs font-bold text-accent">
            {inCart.length} de {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {done ? "Tudo no carrinho 🎉" : `${remaining.length} restantes • ${progress}% concluído`}
        </p>
      </header>

      <div className="space-y-6 px-6">
        {total === 0 ? (
          <Empty />
        ) : (
          <>
            {remaining.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Para comprar
                </h2>
                <div className="space-y-2 animate-slide-up">
                  {remaining.map((p) => (
                    <ShoppingRow key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}

            {done && <DoneCard />}

            {inCart.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  No carrinho ({inCart.length})
                </h2>
                <div className="space-y-2">
                  {inCart.map((p) => (
                    <ShoppingRow key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}

            <p className="pt-2 text-center text-[11px] text-muted-foreground">
              Dica: arraste um item para a direita para adicionar ao carrinho.
            </p>
          </>
        )}
      </div>
    </>
  );
}

function Empty() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent">
        <PartyPopper className="size-6" strokeWidth={2} />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">Nada faltando</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Sua despensa está em dia. A lista aparece quando um item fica abaixo do mínimo ou é
        adicionado manualmente pelo produto.
      </p>
    </div>
  );
}

function DoneCard() {
  return (
    <div className="animate-pop-in rounded-3xl bg-accent p-6 text-center text-accent-foreground shadow-[var(--shadow-pop)]">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-foreground/15">
        <PartyPopper className="size-6" strokeWidth={2.4} />
      </div>
      <p className="mt-3 text-lg font-extrabold tracking-tight">Compra concluída</p>
      <p className="mt-1 text-sm opacity-90">Bom trabalho. Quando quiser, atualize o inventário.</p>
    </div>
  );
}
