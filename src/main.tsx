import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryCache, QueryClient, MutationCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { registerSW } from "virtual:pwa-register";
import { Toaster } from "sonner";
import { App } from "./presentation/App";
import { ThemeProvider } from "./presentation/theme/ThemeProvider";
import { ErrorBoundary } from "./presentation/components/ErrorBoundary";
import { GoogleAuthError } from "@/infrastructure/google/googleApiFetch";
import { showReconnectToast } from "@/lib/googleAuthToast";
import { initAuthScheduler } from "@/services/googleAuth";
import "./styles.css";

registerSW({ immediate: true });
initAuthScheduler();

const TEN_MINUTES = 10 * 60 * 1000;

/** Surfaces session-expiry consistently across every query and mutation, regardless
 *  of whether the call site wires its own `onError` — see `showReconnectToast`. */
function handleAuthError(error: unknown) {
  if (error instanceof GoogleAuthError) showReconnectToast();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: TEN_MINUTES,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
  queryCache: new QueryCache({ onError: handleAuthError }),
  mutationCache: new MutationCache({ onError: handleAuthError }),
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "home-inventory-query-cache",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        // Bump buster on any breaking change to cached shapes (Product/Category/Location
        // fields) so stale localStorage snapshots get discarded instead of restored.
        persistOptions={{ persister, maxAge: TEN_MINUTES, buster: "v2" }}
      >
        <ThemeProvider>
          <BrowserRouter basename={import.meta.env.VITE_BASE_PATH ?? "/"}>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "var(--color-card)",
                  color: "var(--color-card-foreground)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "16px",
                },
              }}
            />
          </BrowserRouter>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
