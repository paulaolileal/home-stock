import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import fs from "node:fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.VITE_BASE_PATH ?? "/",
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "spa-404",
        closeBundle() {
          const outDir = "dist";
          const src = path.join(outDir, "index.html");
          const dest = path.join(outDir, "404.html");
          if (fs.existsSync(src)) fs.copyFileSync(src, dest);
        },
      },
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "home-stock-logo.png"],
        manifest: {
          name: "Home Inventory",
          short_name: "HomeStock",
          lang: "pt-BR",
          description:
            "Mantenha o inventário da casa atualizado em segundos. Lista de compras automática, gestos rápidos e experiência de app nativo.",
          display: "standalone",
          background_color: "#fafafa",
          theme_color: "#4db155",
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "icons/icon-512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Sheets/Drive/OpenFoodFacts/GIS data must never be served stale
          // from cache — this app has no offline mode by design.
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.hostname.endsWith("googleapis.com") ||
                url.hostname.endsWith("openfoodfacts.org") ||
                url.hostname === "accounts.google.com",
              handler: "NetworkOnly",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
      dedupe: ["react", "react-dom"],
    },
    server: {
      host: "::",
      port: 8080,
      strictPort: true,
      allowedHosts: true,
    },
    preview: {
      host: "::",
      port: 8080,
      strictPort: true,
      allowedHosts: true,
    },
  };
});
