import { useEffect, useState } from "react";
import { CameraOff, ScanLine, X } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

const TIMEOUT_MS = 20_000;

export function BarcodeScannerModal({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const [timedOut, setTimedOut] = useState(false);
  const { videoRef, status } = useBarcodeScanner((code) => {
    if (navigator.vibrate) navigator.vibrate(10);
    onDetected(code);
  });

  useEffect(() => {
    if (status !== "scanning") return;
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <p className="text-sm font-semibold text-white">Escanear código de barras</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="grid size-9 place-items-center rounded-full bg-white/10 text-white"
        >
          <X className="size-4" strokeWidth={2.4} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />

        {status !== "denied" && status !== "error" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-28 w-64 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {status === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-8 text-center">
            <CameraOff className="size-8 text-white/70" strokeWidth={1.8} />
            <div>
              <p className="text-sm font-semibold text-white">Permissão de câmera negada</p>
              <p className="mt-1 text-xs text-white/60">
                Habilite o acesso à câmera nas configurações do navegador ou preencha os dados
                manualmente.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black"
            >
              Preencher manualmente
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-8 text-center">
            <CameraOff className="size-8 text-white/70" strokeWidth={1.8} />
            <p className="text-sm text-white/80">Não foi possível acessar a câmera.</p>
            <button
              onClick={onClose}
              className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black"
            >
              Fechar
            </button>
          </div>
        )}
      </div>

      {(status === "starting" || status === "scanning") && (
        <div className="flex flex-col items-center gap-2 px-6 py-6 text-center">
          <div className="flex items-center gap-2 text-white/90">
            <ScanLine className="size-4 animate-pulse" strokeWidth={2.2} />
            <span className="text-sm font-medium">
              {status === "starting" ? "Iniciando câmera…" : "Procurando código…"}
            </span>
          </div>
          {timedOut && (
            <p className="text-xs text-white/50">Aproxime mais o código ou melhore a iluminação.</p>
          )}
        </div>
      )}
    </div>
  );
}
