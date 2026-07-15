import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Toaster } from "sonner";
import { App } from "./presentation/App";
import { ThemeProvider } from "./presentation/theme/ThemeProvider";
import { ErrorBoundary } from "./presentation/components/ErrorBoundary";
import "./styles.css";

const TEN_MINUTES = 10 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: TEN_MINUTES,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
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
        persistOptions={{ persister, maxAge: TEN_MINUTES, buster: "v1" }}
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
