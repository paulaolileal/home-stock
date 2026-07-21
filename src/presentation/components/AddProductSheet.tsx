import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AddProductForm } from "@/presentation/components/AddProductForm";

export function AddProductSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="px-6 pt-8 pb-2">
          <SheetTitle>Adicionar produto</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-6 pb-8">
          <AddProductForm onSuccess={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
