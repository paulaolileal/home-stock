import type { Category, Location, Product } from "./types";

/**
 * Contrato do repositório de inventário. A camada de infraestrutura implementa
 * (Google Sheets) sem que UI nem domínio precisem saber do detalhe de armazenamento.
 */
export interface InventoryRepository {
  // products
  getProducts(): Promise<Product[]>;
  createProduct(input: Omit<Product, "id" | "updatedAt">): Promise<Product>;
  updateProduct(id: string, patch: Partial<Omit<Product, "id">>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // categories
  getCategories(): Promise<Category[]>;
  createCategory(name: string): Promise<Category>;
  updateCategory(id: string, name: string): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // locations
  getLocations(): Promise<Location[]>;
  createLocation(name: string): Promise<Location>;
  updateLocation(id: string, name: string): Promise<Location>;
  deleteLocation(id: string): Promise<void>;
}
