import { useLayoutEffect, useRef, useState } from "react";
import { ScanLine, ImageOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScannerModal } from "@/presentation/components/BarcodeScannerModal";
import { LocationSelectItems } from "@/presentation/components/LocationSelectItems";
import { QuickAddDialog } from "@/presentation/components/QuickAddDialog";
import { useBarcodeLookup } from "@/hooks/useBarcodeLookup";
import { useCategories, useCreateProduct, useLocations } from "@/hooks/queries";
import { withEmoji } from "@/domain/lookup";
import { COMMON_UNITS } from "@/domain/units";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const NEW_ITEM_VALUE = "__new__";

export function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const createProduct = useCreateProduct();
  const lookupBarcode = useBarcodeLookup();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [min, setMin] = useState(1);
  const [ideal, setIdeal] = useState(3);
  const [unit, setUnit] = useState<string>("unidades");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState("");
  const [barcode, setBarcode] = useState<string | undefined>();
  const [quickAdd, setQuickAdd] = useState<"category" | "location" | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  function handleCategoryChange(value: string) {
    if (value === NEW_ITEM_VALUE) {
      setQuickAdd("category");
      return;
    }
    setCategoryId(value);
  }

  function handleLocationChange(value: string) {
    if (value === NEW_ITEM_VALUE) {
      setQuickAdd("location");
      return;
    }
    setLocationId(value);
  }

  async function handleBarcodeDetected(code: string) {
    setScannerOpen(false);
    setBarcode(code);
    const found = await lookupBarcode.mutateAsync(code);
    if (!found) {
      toast("Código capturado, produto não encontrado", {
        description: "Preencha os dados manualmente.",
      });
      return;
    }
    if (found.name) setName(found.name);
    if (found.brand) setNotes(found.brand);
    if (found.image) setImage(found.image);
    if (found.category) {
      const match = categories.find((c) => c.name.toLowerCase() === found.category!.toLowerCase());
      if (match) setCategoryId(match.id);
    }
    toast.success("Produto encontrado", { description: "Confira os dados antes de salvar." });
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Dê um nome para o produto");
      return;
    }
    createProduct.mutate(
      {
        name: name.trim(),
        categoryId,
        locationId,
        quantity,
        minQuantity: min,
        idealQuantity: Math.max(min, ideal),
        unit,
        notes: notes.trim() || undefined,
        image: image.trim() || undefined,
        barcode,
        favorite: false,
      },
      {
        onSuccess: () => {
          toast.success("Produto adicionado");
          onSuccess();
        },
      },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setScannerOpen(true)}
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

      {barcode && (
        <p className="text-center text-[11px] text-muted-foreground">
          Código capturado: <span className="font-mono">{barcode}</span>
        </p>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-border">
        <Field label="Nome">
          <input
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Café Tradicional"
            className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Categoria" value={categoryId} onChange={handleCategoryChange}>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {withEmoji(c)}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value={NEW_ITEM_VALUE} className="font-semibold text-primary">
              <span className="inline-flex items-center gap-1">
                <Plus className="size-3.5" strokeWidth={2.5} />
                Nova categoria
              </span>
            </SelectItem>
          </SelectField>
          <SelectField label="Local" value={locationId} onChange={handleLocationChange}>
            <LocationSelectItems locations={locations} />
            <SelectSeparator />
            <SelectItem value={NEW_ITEM_VALUE} className="font-semibold text-primary">
              <span className="inline-flex items-center gap-1">
                <Plus className="size-3.5" strokeWidth={2.5} />
                Novo local
              </span>
            </SelectItem>
          </SelectField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <NumField label="Atual" value={quantity} onChange={setQuantity} />
          <NumField label="Mínimo" value={min} onChange={setMin} />
          <NumField label="Ideal" value={ideal} onChange={setIdeal} />
        </div>

        <SelectField label="Unidade" value={unit} onChange={setUnit}>
          {(COMMON_UNITS as readonly string[]).includes(unit) ? null : (
            <SelectItem value={unit}>{unit}</SelectItem>
          )}
          {COMMON_UNITS.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectField>

        <Field label="Imagem (URL, opcional)">
          <div className="flex items-center gap-3">
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
            />
            {image ? (
              <img
                src={image}
                alt=""
                className="size-9 shrink-0 rounded-[10px] bg-surface-2 object-contain p-1 ring-1 ring-border"
              />
            ) : (
              <ImageOff className="size-5 shrink-0 text-muted-foreground" strokeWidth={2} />
            )}
          </div>
        </Field>

        <Field label="Observações (opcional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: comprar a versão sem açúcar"
            rows={2}
            className="w-full resize-none border-0 bg-transparent p-0 text-sm font-semibold shadow-none outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </Field>

        <button
          type="submit"
          disabled={createProduct.isPending}
          className="mt-2 w-full rounded-2xl bg-foreground py-3.5 text-sm font-bold text-background transition-transform active:scale-[0.99] disabled:opacity-60"
        >
          Salvar produto
        </button>
      </form>

      {scannerOpen && (
        <BarcodeScannerModal
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {quickAdd && (
        <QuickAddDialog
          type={quickAdd}
          open={!!quickAdd}
          onOpenChange={(open) => !open && setQuickAdd(null)}
          onCreated={(item) => {
            if (quickAdd === "category") setCategoryId(item.id);
            else setLocationId(item.id);
          }}
        />
      )}
    </>
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

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="block rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-border">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-0.5 h-auto w-full border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
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
