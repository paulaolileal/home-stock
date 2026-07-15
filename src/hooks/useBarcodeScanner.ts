import { useEffect, useRef, useState } from "react";
import { BarcodeDetector } from "barcode-detector";

export type ScannerStatus = "idle" | "starting" | "scanning" | "denied" | "error";

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"] as const;

/**
 * Abre a câmera traseira e roda a detecção de código de barras em loop via
 * requestAnimationFrame. `barcode-detector` é um ponyfill (zxing-wasm) —
 * funciona em todos os browsers, inclusive os que não implementam a
 * `BarcodeDetector` nativa (ex. Safari/iOS).
 */
export function useBarcodeScanner(onDetected: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<ScannerStatus>("idle");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    const detector = new BarcodeDetector({ formats: [...FORMATS] });

    async function start() {
      setStatus("starting");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("scanning");

        const tick = async () => {
          if (cancelled) return;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                onDetected(codes[0].rawValue);
                return;
              }
            } catch {
              // frame not ready yet — ignore and retry next tick
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        setStatus((e as DOMException).name === "NotAllowedError" ? "denied" : "error");
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, status };
}
