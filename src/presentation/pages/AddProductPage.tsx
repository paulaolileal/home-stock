import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AddProductForm } from "@/presentation/components/AddProductForm";

export function AddProductPage() {
  const navigate = useNavigate();

  return (
    <>
      <header className="px-6 pt-12 pb-4">
        <button
          onClick={() => navigate("/")}
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
        <AddProductForm onSuccess={() => navigate("/")} />
      </div>
    </>
  );
}
