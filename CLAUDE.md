# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server (localhost:8080)
npm run build       # production build
npm run preview     # preview the production build
npm run lint        # ESLint
npm run lint:fix     # ESLint with autofix
npm run format       # Prettier
```

There are no automated tests in this project.

## Architecture

This is a **frontend-only SPA** (React 19 + Vite + TypeScript) for home inventory
management. The backend is the user's own Google Sheets spreadsheet — there is no
server of our own, and no mock/offline mode. Login with Google is mandatory.

### Layer dependency rule

```
presentation → hooks → domain ← infrastructure
                    ↑
             application (repositoryProvider)
```

- **UI and hooks** depend on `domain` types and never import from `infrastructure`
  directly.
- **`application/repositoryProvider.ts`** is the single decision point: it resolves
  the logged-in user's `spreadsheetId` and returns a cached `GoogleSheetsRepository`.
- Adding a new backend means: create a new class implementing `InventoryRepository`
  (`src/domain/repository.ts`), then switch the provider — zero UI changes needed.

### Key files

| Path | Role |
|---|---|
| `src/domain/types.ts` | `Product`, `Category`, `Location` |
| `src/domain/repository.ts` | `InventoryRepository` — the contract every backend must implement |
| `src/domain/schemas.ts` | Zod — input sanitization (strips HTML tags/control chars) |
| `src/domain/lookup.ts` | `resolveName()` — resolves a `categoryId`/`locationId` to its display name |
| `src/lib/locationFormat.ts` | Hierarchical location name helpers (`"Cozinha > Geladeira"` → breadcrumb/grouping) |
| `src/application/repositoryProvider.ts` | Singleton factory, cached by `spreadsheetId` |
| `src/hooks/queries.ts` | All TanStack Query hooks + mutations; quantity increments are debounced |
| `src/services/config.ts` | Reads `VITE_GOOGLE_CLIENT_ID`; exposes OAuth scopes |
| `src/services/googleAuth.ts` | Google Identity Services OAuth flow; access token lives **in memory only** + mirrored to `sessionStorage`, never `localStorage`. `ensureAccessToken()` is the async variant all repository/API clients use — it transparently retries a silent sign-in (no prompt) before giving up when the cached token expired; concurrent callers share one in-flight attempt. Plain `getAccessToken()` (sync, no renewal) is only for render-time checks (`ProtectedRoute`, `LoginPage`) |
| `src/store/authStore.ts` | Zustand+persist: logged-in `UserInfo` |
| `src/store/spreadsheetStore.ts` | Zustand+persist: `spreadsheetId` per user e-mail |
| `src/infrastructure/google/GoogleSheetsRepository.ts` | CRUD against Sheets API v4 (raw `fetch`, no SDK) |
| `src/infrastructure/google/DriveApiClient.ts` | Finds/creates the spreadsheet's Drive folder |
| `src/infrastructure/google/SheetsInitializer.ts` | Creates the spreadsheet / ensures the 3 sheets+headers exist |
| `src/infrastructure/openfoodfacts/OpenFoodFactsClient.ts` | Public, unauthenticated barcode metadata lookup |
| `src/presentation/components/BarcodeScannerModal.tsx` | Camera UI + barcode detection |
| `src/hooks/useBarcodeScanner.ts` | `getUserMedia` + `BarcodeDetector` (via `barcode-detector` ponyfill) detection loop |

### Routes (`src/presentation/App.tsx`, React Router v7)

| Path | Page |
|---|---|
| `/login` | LoginPage |
| `/setup` | SetupPage — creates/links the user's spreadsheet (runs once, right after first login) |
| `/` | InventoryPage |
| `/adicionar` | AddProductPage (includes the barcode scanner) |
| `/buscar` | SearchPage |
| `/compras` | ShoppingListPage |
| `/produto/:id` | ProductDetailPage |
| `/configuracoes` | SettingsPage (theme, categories, locations, Google account) |

Route guards: `ProtectedRoute` (redirects to `/login` if not authenticated) wraps
everything; `SpreadsheetRoute` (redirects to `/setup` if the logged-in user has no
`spreadsheetId` yet) wraps everything except `/setup` itself. Unknown paths redirect
to `/404`.

### Data conventions

- Products reference `category`/`location` by **id** (`categoryId`/`locationId`),
  not by name — renaming a category/location is a single write to its own row,
  never touches product rows. Display code resolves the name via
  `resolveName()` (`src/domain/lookup.ts`), which falls back to `"—"` if the
  category/location was deleted.
- Categories can have an optional `emoji` (stored in its own `emoji` column in
  the `categories` sheet), shown as a prefix to the name via `withEmoji()`
  (`src/domain/lookup.ts`, used by `resolveName()` too). Locations have no
  equivalent field.
- Locations can use a hierarchical name convention, `"Grupo > Local"` (e.g.
  `"Cozinha > Geladeira"`), rendered as a breadcrumb (`formatLocation`) and
  grouped in selects/settings (`groupLocations`) — see `src/lib/locationFormat.ts`.
  This is a display convention on the `name` string, unrelated to id references.
- Quantity is never negative.
- The Google Sheets spreadsheet has 3 tabs: `products`, `categories`, `locations`
  (headers defined in `SheetsInitializer.ts`).
- Deleting a category/location does not touch existing products — they keep the
  now-dangling id (shown as "—" until re-assigned).
- The shopping list (`/compras`) shows a product when `needsShopping()` (quantity
  below `minQuantity`) **or** `wanted` **or** `inCart` is true. `wanted` lets a
  product be added to the list on demand regardless of stock thresholds (e.g. an
  item with no minimum kept, like a one-off produce purchase); toggled from
  `ProductCard`/`ProductDetailPage`. `inCart` means "already picked up during this
  shopping trip" (checked off, struck through) — set together with a quantity bump
  when `ShoppingRow.confirmPurchase()` runs, which also clears `wanted`. Product
  sheet columns are append-only: new fields must be added at the **end** of the
  `products` headers array (both in `SheetsInitializer.ts` and
  `GoogleSheetsRepository.ts`) so existing users' spreadsheets don't get their
  columns shifted. `SheetsInitializer.ensureSheets()` only runs once, during
  `/setup` — accounts set up before a column was added never see it applied. To
  cover that, `GoogleSheetsRepository.ensureProductHeaders()` self-heals the
  `products` header row (patches it in place if out of date) on first use per
  repository instance; any new product field needs no extra wiring for this,
  but the append-only rule above still applies.

### Adding mutations

All mutations live in `src/hooks/queries.ts`. Quantity increments (+/-) are a special
case: they update the TanStack Query cache immediately (tactile feel) and write to
the spreadsheet after a 600ms debounce, flushed on `visibilitychange`/`beforeunload`
— this avoids one Sheets API request per tap. Every other mutation
(`useToggleFavorite`, `useSetInCart`, `useUpdateProduct`, etc.) follows the standard
`onMutate` optimistic update / `onError` rollback / `onSettled` invalidate pattern.

### Environment variables

```
VITE_GOOGLE_CLIENT_ID=   # OAuth Client ID (Web application) — required, no fallback/mock mode
VITE_BASE_PATH=/         # optional, only for deploying under a subpath
```

### UI components

`src/components/ui/` contains shadcn/ui primitives (Radix-based) and is excluded
from ESLint. Do not modify these files directly — extend them via composition in
`src/presentation/components/`.
