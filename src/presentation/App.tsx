import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SpreadsheetRoute } from "./components/SpreadsheetRoute";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { InventoryPage } from "./pages/InventoryPage";
import { AddProductPage } from "./pages/AddProductPage";
import { SearchPage } from "./pages/SearchPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="setup" element={<SetupPage />} />
        <Route element={<SpreadsheetRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<InventoryPage />} />
            <Route path="adicionar" element={<AddProductPage />} />
            <Route path="buscar" element={<SearchPage />} />
            <Route path="compras" element={<ShoppingListPage />} />
            <Route path="produto/:id" element={<ProductDetailPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
