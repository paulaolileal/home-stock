import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScanLine, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { useCategories, useLocations, upsertProduct, newId } from "@/lib/store";

export const Route = createFileRoute("/adicionar")({
  head: () => ({
    meta: [
      { title: "Adicionar produto — Home Inventory" },
      { name: "description", content: "Adicione um novo item ao inventário em segundos." },
    ],
  }),
  component: Adicionar,
});

function Adicionar() {
  const navigate = useNavigate();
  const categories = useCategories();
  const locations = useLocations();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]?.name ?? "Despensa");
  const [location, setLocation] = useState(locations[0]?.name ?? "Cozinha");
  const [quantity, setQuantity] = useState(1);
  const [min, setMin] = useState(1);
  const [ideal, setIdeal] = useState(3);
  const [unit, setUnit] = useState("unidades");
  const [brand, setBrand] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Dê um nome para o produto");
      return;
    }
    upsertProduct({
      id: newId(),
      name: name.trim(),
      category,
      location,
      quantity,
      minQuantity: min,
      idealQuantity: Math.max(min, ideal),
      unit,
      brand: brand.trim() || undefined,
      favorite: false,
      updatedAt: new Date().toISOString(),
    });
    toast.success("Produto adicionado");
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <header className="px-6 pt-12 pb-4">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-3 inline-flex size-9 items-center justify-center rounded-full bg-surface-2 ring-1 ring-border"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-4" strokeWidth={2.4} />
        </button>
        <h1 className="animate-slide-up text-3xl font-extrabold tracking-tight">
          Adicionar produto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escaneie um código ou preencha o essencial.
        </p>
      </header>

      <div className="space-y-4 px-6 pb-4">
        <button
          type="button"
          onClick={() =>
            toast("Escaneamento em breve", {
              description: "Você poderá escanear códigos de barra após conectar a conta Google.",
            })
          }
          className="flex w-full items-center gap-3 rounded-3xl bg-foreground p-4 text-background shadow-[var(--shadow-pop)] transition-transform active:scale-[0.99]"
        >
          <div className="grid size-11 place-items-center rounded-2xl bg-background/15">
            <ScanLine className="size-6" strokeWidth={2.2} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Escanear código de barras</p>
            <p className="text-xs opacity-70">Preenche os campos automaticamente</p>
          </div>
        </button>

        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-border">
          <Field label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Café Tradicional"
              className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Local">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <NumField label="Atual" value={quantity} onChange={setQuantity} />
            <NumField label="Mínimo" value={min} onChange={setMin} />
            <NumField label="Ideal" value={ideal} onChange={setIdeal} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unidade">
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="unidades"
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
            </Field>
            <Field label="Marca (opcional)">
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="—"
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
            </Field>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-foreground py-3.5 text-sm font-bold text-background transition-transform active:scale-[0.99]"
          >
            Salvar produto
          </button>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-border">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-border">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mt-0.5 w-full bg-transparent font-mono text-lg font-bold outline-none"
      />
    </label>
  );
}
