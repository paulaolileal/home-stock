import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X, Moon, Sun, Monitor, LogOut, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import {
  useCategories,
  useCreateCategory,
  useCreateLocation,
  useDeleteCategory,
  useDeleteLocation,
  useLocations,
  useUpdateCategory,
  useUpdateLocation,
} from "@/hooks/queries";
import { useTheme } from "@/presentation/theme/ThemeProvider";
import { clearSheetProvider } from "@/application/repositoryProvider";
import { clearAccessToken } from "@/services/googleAuth";
import { useAuthStore } from "@/store/authStore";
import { useSpreadsheetStore } from "@/store/spreadsheetStore";
import { groupLocations, locationLeaf, shouldShowGroupLabel } from "@/lib/locationFormat";

export function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { mode, setMode } = useTheme();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const { user, clearUser } = useAuthStore();
  const clearSpreadsheetId = useSpreadsheetStore((s) => s.clearSpreadsheetId);
  const [newCat, setNewCat] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [newLoc, setNewLoc] = useState("");

  function handleSwitchSpreadsheet() {
    if (!user) return;
    clearSpreadsheetId(user.email);
    clearSheetProvider();
    qc.clear();
    navigate("/setup");
  }

  function handleSignOut() {
    clearAccessToken();
    clearUser();
    clearSheetProvider();
    qc.clear();
    navigate("/login");
  }

  return (
    <>
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
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 ring-1 ring-border">
            {user?.picture && (
              <img
                src={user.picture}
                alt=""
                className="size-10 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handleSwitchSpreadsheet}
              className="flex items-center justify-center gap-2 rounded-2xl bg-surface-2 py-2.5 text-xs font-bold ring-1 ring-border"
            >
              <RefreshCcw className="size-3.5" strokeWidth={2.4} />
              Trocar planilha
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 rounded-2xl bg-surface-2 py-2.5 text-xs font-bold text-destructive ring-1 ring-border"
            >
              <LogOut className="size-3.5" strokeWidth={2.4} />
              Sair
            </button>
          </div>
        </Section>

        <Section title="Categorias">
          <ChipEditor
            items={categories}
            value={newCat}
            onChange={setNewCat}
            emojiValue={newCatEmoji}
            onEmojiValueChange={setNewCatEmoji}
            onAdd={() => {
              if (!newCat.trim()) return;
              createCategory.mutate({
                name: newCat.trim(),
                emoji: newCatEmoji.trim() || undefined,
              });
              setNewCat("");
              setNewCatEmoji("");
            }}
            onRename={(id, name) =>
              updateCategory.mutate(
                { id, name },
                { onError: () => toast.error("Não foi possível renomear a categoria") },
              )
            }
            onRemove={(id) =>
              deleteCategory.mutate(id, {
                onError: () => toast.error("Não foi possível remover a categoria"),
              })
            }
            onEmojiChange={(id, emoji) =>
              updateCategory.mutate(
                { id, emoji },
                { onError: () => toast.error("Não foi possível atualizar o emoji") },
              )
            }
            placeholder="Nova categoria..."
          />
        </Section>

        <Section title="Locais">
          <LocationChipEditor
            locations={locations}
            value={newLoc}
            onChange={setNewLoc}
            onAdd={() => {
              if (!newLoc.trim()) return;
              createLocation.mutate(newLoc.trim());
              setNewLoc("");
            }}
            onRename={(id, name) =>
              updateLocation.mutate(
                { id, name },
                { onError: () => toast.error("Não foi possível renomear o local") },
              )
            }
            onRemove={(id) =>
              deleteLocation.mutate(id, {
                onError: () => toast.error("Não foi possível remover o local"),
              })
            }
          />
          <p className="mt-3 px-1 text-[11px] text-muted-foreground">
            Use "Grupo &gt; Local" para organizar por cômodo, como "Cozinha &gt; Geladeira".
          </p>
        </Section>

        <Section title="Sobre">
          <div className="rounded-2xl bg-surface-2 p-4 text-xs text-muted-foreground ring-1 ring-border">
            <p className="text-sm font-semibold text-foreground">Home Inventory</p>
            <p className="mt-1">
              Versão 1.0.0 — seus dados ficam na sua planilha do Google Sheets.
            </p>
          </div>
        </Section>
      </div>
    </>
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
  onRename,
  onRemove,
  onEmojiChange,
  emojiValue,
  onEmojiValueChange,
  placeholder,
}: {
  items: { id: string; name: string; emoji?: string }[];
  value: string;
  onChange: (s: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onEmojiChange?: (id: string, emoji: string) => void;
  emojiValue?: string;
  onEmojiValueChange?: (s: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <EditableChip
            key={it.id}
            id={it.id}
            name={it.name}
            emoji={it.emoji}
            onRename={onRename}
            onRemove={onRemove}
            onEmojiChange={onEmojiChange}
          />
        ))}
      </div>
      <AddChipForm
        value={value}
        onChange={onChange}
        onAdd={onAdd}
        placeholder={placeholder}
        emojiValue={emojiValue}
        onEmojiValueChange={onEmojiValueChange}
      />
    </div>
  );
}

function LocationChipEditor({
  locations,
  value,
  onChange,
  onAdd,
  onRename,
  onRemove,
}: {
  locations: { id: string; name: string }[];
  value: string;
  onChange: (s: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const groups = groupLocations(locations);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {groups.map(({ group, items }) => {
          const labeled = shouldShowGroupLabel(items);
          return (
            <div key={group}>
              {labeled && (
                <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {group}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {items.map((it) => (
                  <EditableChip
                    key={it.id}
                    id={it.id}
                    name={it.name}
                    displayName={labeled ? locationLeaf(it.name) : it.name}
                    onRename={onRename}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <AddChipForm
        value={value}
        onChange={onChange}
        onAdd={onAdd}
        placeholder="Novo local... (ex.: Cozinha > Geladeira)"
      />
    </div>
  );
}

function AddChipForm({
  value,
  onChange,
  onAdd,
  placeholder,
  emojiValue,
  onEmojiValueChange,
}: {
  value: string;
  onChange: (s: string) => void;
  onAdd: () => void;
  placeholder: string;
  emojiValue?: string;
  onEmojiValueChange?: (s: string) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd();
      }}
      className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2 ring-1 ring-border"
    >
      {onEmojiValueChange && (
        <input
          value={emojiValue ?? ""}
          onChange={(e) => onEmojiValueChange(e.target.value)}
          placeholder="🔖"
          maxLength={4}
          aria-label="Emoji da categoria"
          className="w-8 shrink-0 rounded-full bg-background text-center text-sm outline-none ring-1 ring-border"
        />
      )}
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
  );
}

function EditableChip({
  id,
  name,
  displayName = name,
  emoji,
  onRename,
  onRemove,
  onEmojiChange,
}: {
  id: string;
  name: string;
  displayName?: string;
  emoji?: string;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onEmojiChange?: (id: string, emoji: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [editingEmoji, setEditingEmoji] = useState(false);
  const [emojiDraft, setEmojiDraft] = useState(emoji ?? "");

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(id, trimmed);
    else setDraft(name);
  }

  function commitEmoji() {
    setEditingEmoji(false);
    const trimmed = emojiDraft.trim();
    if (trimmed !== (emoji ?? "")) onEmojiChange?.(id, trimmed);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(name);
            setEditing(false);
          }
        }}
        className="w-36 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold ring-1 ring-ring outline-none"
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold ring-1 ring-border">
      {onEmojiChange &&
        (editingEmoji ? (
          <input
            autoFocus
            value={emojiDraft}
            onChange={(e) => setEmojiDraft(e.target.value)}
            onBlur={commitEmoji}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEmoji();
              if (e.key === "Escape") {
                setEmojiDraft(emoji ?? "");
                setEditingEmoji(false);
              }
            }}
            maxLength={4}
            className="w-8 rounded-full bg-background text-center text-sm outline-none ring-1 ring-ring"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEmojiDraft(emoji ?? "");
              setEditingEmoji(true);
            }}
            aria-label={emoji ? `Alterar emoji de ${name}` : `Adicionar emoji para ${name}`}
            className="grid size-4 place-items-center text-sm leading-none opacity-80"
          >
            {emoji || "🔖"}
          </button>
        ))}
      <button
        type="button"
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
        aria-label={`Editar ${displayName}`}
        className="max-w-[10rem] truncate text-left"
      >
        {displayName}
      </button>
      <button
        onClick={() => onRemove(id)}
        aria-label={`Remover ${displayName}`}
        className="grid size-4 place-items-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="size-3" strokeWidth={2.4} />
      </button>
    </span>
  );
}
