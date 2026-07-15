import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, Moon, Sun, Monitor, Cloud } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import {
  addCategory,
  addLocation,
  removeCategory,
  removeLocation,
  useCategories,
  useLocations,
} from "@/lib/store";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Home Inventory" },
      { name: "description", content: "Tema, categorias, locais e conta Google." },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { mode, setMode } = useTheme();
  const categories = useCategories();
  const locations = useLocations();
  const [newCat, setNewCat] = useState("");
  const [newLoc, setNewLoc] = useState("");

  return (
    <AppShell>
      <header className="px-6 pt-12 pb-4">
        <h1 className="animate-slide-up text-3xl font-extrabold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalize o app.</p>
      </header>

      <div className="space-y-4 px-6 pb-4">
        <Section title="Tema">
          <div className="grid grid-cols-3 gap-2">
            <ThemeOption
              active={mode === "light"}
              onClick={() => setMode("light")}
              icon={<Sun className="size-4" strokeWidth={2.2} />}
              label="Claro"
            />
            <ThemeOption
              active={mode === "dark"}
              onClick={() => setMode("dark")}
              icon={<Moon className="size-4" strokeWidth={2.2} />}
              label="Escuro"
            />
            <ThemeOption
              active={mode === "system"}
              onClick={() => setMode("system")}
              icon={<Monitor className="size-4" strokeWidth={2.2} />}
              label="Sistema"
            />
          </div>
        </Section>

        <Section title="Conta Google">
          <button
            onClick={() =>
              toast("Login em breve", {
                description:
                  "Habilite o conector Google para sincronizar com Sheets e Drive.",
              })
            }
            className="flex w-full items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left ring-1 ring-border transition-transform active:scale-[0.99]"
          >
            <div className="grid size-10 place-items-center rounded-xl bg-card ring-1 ring-border">
              <Cloud className="size-4" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Conectar conta Google</p>
              <p className="truncate text-xs text-muted-foreground">
                Sincroniza com Google Sheets e Drive
              </p>
            </div>
            <span className="rounded-full bg-alert/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-alert">
              Em breve
            </span>
          </button>
        </Section>

        <Section title="Categorias">
          <ChipEditor
            items={categories.map((c) => ({ id: c.id, name: c.name }))}
            value={newCat}
            onChange={setNewCat}
            onAdd={() => {
              if (!newCat.trim()) return;
              addCategory(newCat.trim());
              setNewCat("");
            }}
            onRemove={removeCategory}
            placeholder="Nova categoria..."
          />
        </Section>

        <Section title="Locais">
          <ChipEditor
            items={locations.map((l) => ({ id: l.id, name: l.name }))}
            value={newLoc}
            onChange={setNewLoc}
            onAdd={() => {
              if (!newLoc.trim()) return;
              addLocation(newLoc.trim());
              setNewLoc("");
            }}
            onRemove={removeLocation}
            placeholder="Novo local..."
          />
        </Section>

        <Section title="Sobre">
          <div className="rounded-2xl bg-surface-2 p-4 text-xs text-muted-foreground ring-1 ring-border">
            <p className="text-sm font-semibold text-foreground">Home Inventory</p>
            <p className="mt-1">Versão 1.0.0 — sem servidor. Seus dados ficam no dispositivo até você conectar o Google.</p>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="animate-slide-up">
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="rounded-3xl bg-card p-4 ring-1 ring-border">{children}</div>
    </section>
  );
}

function ThemeOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-semibold ring-1 transition-colors ${
        active
          ? "bg-foreground text-background ring-transparent"
          : "bg-surface-2 text-foreground ring-border"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ChipEditor({
  items,
  value,
  onChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: { id: string; name: string }[];
  value: string;
  onChange: (s: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <span
            key={it.id}
            className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold ring-1 ring-border"
          >
            {it.name}
            <button
              onClick={() => onRemove(it.id)}
              aria-label={`Remover ${it.name}`}
              className="grid size-4 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" strokeWidth={2.4} />
            </button>
          </span>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
        className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2 ring-1 ring-border"
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Adicionar"
          className="grid size-7 place-items-center rounded-full bg-foreground text-background"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
