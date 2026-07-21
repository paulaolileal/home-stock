import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateCategory, useCreateLocation } from "@/hooks/queries";

type QuickAddType = "category" | "location";

const COPY: Record<QuickAddType, { title: string; placeholder: string }> = {
  category: { title: "Nova categoria", placeholder: "Ex.: Despensa" },
  location: { title: "Novo local", placeholder: "Ex.: Cozinha > Geladeira" },
};

export function QuickAddDialog({
  type,
  open,
  onOpenChange,
  onCreated,
}: {
  type: QuickAddType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (item: { id: string; name: string }) => void;
}) {
  const [name, setName] = useState("");
  const createCategory = useCreateCategory();
  const createLocation = useCreateLocation();
  const pending = type === "category" ? createCategory.isPending : createLocation.isPending;
  const copy = COPY[type];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const mutation = type === "category" ? createCategory : createLocation;
    mutation.mutate(name.trim(), {
      onSuccess: (item) => {
        setName("");
        onOpenChange(false);
        onCreated?.(item);
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2 ring-1 ring-border"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.placeholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-bold text-background disabled:opacity-60"
          >
            Adicionar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
