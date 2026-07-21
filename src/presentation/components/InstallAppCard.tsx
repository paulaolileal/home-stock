import { Download, Check, Share } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallAppCard() {
  const { installed, canInstall, isIos, promptInstall } = useInstallPrompt();

  if (installed) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface-2 p-4 text-xs font-semibold text-muted-foreground ring-1 ring-border">
        <Check className="size-4 text-accent" strokeWidth={2.4} />
        App instalado
      </div>
    );
  }

  if (canInstall) {
    return (
      <button
        onClick={promptInstall}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-xs font-bold text-background ring-1 ring-border"
      >
        <Download className="size-3.5" strokeWidth={2.4} />
        Instalar app
      </button>
    );
  }

  if (isIos) {
    return (
      <div className="mt-3 rounded-2xl bg-surface-2 p-4 text-xs text-muted-foreground ring-1 ring-border">
        <p className="font-semibold text-foreground">Instalar no iPhone/iPad</p>
        <p className="mt-1">
          Toque em <Share className="inline size-3.5 align-text-bottom" strokeWidth={2.4} /> e
          depois em &quot;Adicionar à Tela de Início&quot;.
        </p>
      </div>
    );
  }

  return null;
}
