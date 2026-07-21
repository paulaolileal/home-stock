import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { clearSheetProvider } from "@/application/repositoryProvider";
import { DriveApiClient } from "@/infrastructure/google/DriveApiClient";
import { SheetsInitializer } from "@/infrastructure/google/SheetsInitializer";
import { ensureAccessToken } from "@/services/googleAuth";
import { useAuthStore } from "@/store/authStore";
import { useSpreadsheetStore } from "@/store/spreadsheetStore";

const FOLDER_NAME = "LealTEK Apps";
const SPREADSHEET_TITLE = "Home Inventory";

const STEPS = ["Verificando sua planilha…", "Configurando estrutura…", "Quase lá…"] as const;

export function SetupPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user)!;
  const setSpreadsheetId = useSpreadsheetStore((s) => s.setSpreadsheetId);
  const [error, setError] = useState<string | null>(null);
  const connectingRef = useRef(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (error) return;
    const t1 = setTimeout(() => setStep(1), 1800);
    const t2 = setTimeout(() => setStep(2), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [error]);

  useEffect(() => {
    if (connectingRef.current) return;
    connectingRef.current = true;

    async function connect() {
      const drive = new DriveApiClient(ensureAccessToken);
      const initializer = new SheetsInitializer(ensureAccessToken);
      const found = await drive.listSpreadsheets(SPREADSHEET_TITLE);

      let spreadsheetId: string;
      if (found.length > 0) {
        spreadsheetId = found[0].id;
        await initializer.ensureSheets(spreadsheetId);
      } else {
        spreadsheetId = await initializer.createSpreadsheet(SPREADSHEET_TITLE);
      }

      const folderId = await drive.getOrCreateFolder(FOLDER_NAME);
      await drive.moveToFolder(spreadsheetId, folderId);

      setSpreadsheetId(user.email, spreadsheetId);
      clearSheetProvider();
      qc.clear();
      navigate("/", { replace: true });
    }

    connect().catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="flex w-full max-w-xs flex-col items-center gap-6 text-center">
        <img
          src="/home-stock-logo.png"
          alt="Home Inventory"
          className="size-12 rounded-2xl object-contain"
        />
        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-6 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">{STEPS[step]}</p>
              <p className="mt-1 text-xs text-muted-foreground">Conectando ao Google Drive</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
