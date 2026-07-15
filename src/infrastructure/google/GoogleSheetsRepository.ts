/**
 * Implementação Google Sheets do InventoryRepository.
 *
 * Estratégia:
 * - Lê todas as abas via `values.get`.
 * - Escreve por linha: localiza a linha pelo ID, faz PUT em values/{aba}!A{n}:N{n}.
 * - Cria novas linhas via `values:append` (atômico, sem risco de race condition).
 *
 * Esta implementação assume que o frontend já recebeu um access_token via
 * Google Identity Services e o passou ao construtor (em memória, nunca em
 * localStorage).
 */

import type { InventoryRepository } from "@/domain/repository";
import type { Category, Location, Product } from "@/domain/types";
import { categoryId, locationId, productId } from "@/lib/idgen";

const API = "https://sheets.googleapis.com/v4/spreadsheets";

const SHEETS = {
  products: "products",
  categories: "categories",
  locations: "locations",
} as const;

const PRODUCT_HEADERS = [
  "product_id",
  "name",
  "category",
  "location",
  "quantity",
  "min_quantity",
  "ideal_quantity",
  "unit",
  "brand",
  "barcode",
  "image",
  "favorite",
  "in_cart",
  "updated_at",
];

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  getAccessToken: () => string | null;
}

export class GoogleSheetsRepository implements InventoryRepository {
  constructor(private readonly cfg: GoogleSheetsConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.cfg.getAccessToken();
    if (!token) throw new Error("Sem token Google — faça login novamente.");
    const res = await fetch(`${API}/${this.cfg.spreadsheetId}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sheets API ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  private async getValues(range: string): Promise<string[][]> {
    const data = await this.request<{ values?: string[][] }>(`/values/${range}`);
    return data.values ?? [];
  }

  private rowsToObjects(rows: string[][]): Record<string, string>[] {
    if (rows.length === 0) return [];
    const [headers, ...body] = rows;
    const trimmed = headers.map((h) => h.trim());
    return body.map((r) => {
      const obj: Record<string, string> = {};
      trimmed.forEach((h, i) => (obj[h] = r[i] ?? ""));
      return obj;
    });
  }

  private async findRowIndex(sheet: string, idColumn: string, id: string): Promise<number> {
    const rows = await this.getValues(sheet);
    const headers = rows[0]?.map((h) => h.trim()) ?? [];
    const headerIdx = headers.indexOf(idColumn);
    if (headerIdx < 0) throw new Error(`Cabeçalho ${idColumn} não encontrado em ${sheet}`);
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][headerIdx] === id) return i + 1; // 1-indexed
    }
    throw new Error(`${idColumn}=${id} não encontrado em ${sheet}`);
  }

  private async getSheetId(sheetName: string): Promise<number> {
    const data = await this.request<{
      sheets: { properties: { sheetId: number; title: string } }[];
    }>("");
    const sheet = data.sheets.find((s) => s.properties.title === sheetName);
    if (!sheet) throw new Error(`Aba "${sheetName}" não encontrada na planilha`);
    return sheet.properties.sheetId;
  }

  private async deleteRow(sheet: string, idColumn: string, id: string): Promise<void> {
    const rowIdx = await this.findRowIndex(sheet, idColumn, id);
    const sheetId = await this.getSheetId(sheet);
    await this.request("/:batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: { sheetId, dimension: "ROWS", startIndex: rowIdx - 1, endIndex: rowIdx },
            },
          },
        ],
      }),
    });
  }

  // ---------------------------------------------------------------------
  // products
  // ---------------------------------------------------------------------

  private rowToProduct(r: Record<string, string>): Product {
    return {
      id: r.product_id,
      name: r.name,
      category: r.category,
      location: r.location,
      quantity: Number(r.quantity) || 0,
      minQuantity: Number(r.min_quantity) || 0,
      idealQuantity: Number(r.ideal_quantity) || 0,
      unit: r.unit,
      brand: r.brand || undefined,
      barcode: r.barcode || undefined,
      image: r.image || undefined,
      favorite: r.favorite === "true",
      inCart: r.in_cart === "true",
      updatedAt: r.updated_at,
    };
  }

  private productToRow(p: Product): (string | number)[] {
    return [
      p.id,
      p.name,
      p.category,
      p.location,
      p.quantity,
      p.minQuantity,
      p.idealQuantity,
      p.unit,
      p.brand ?? "",
      p.barcode ?? "",
      p.image ?? "",
      String(p.favorite),
      String(!!p.inCart),
      p.updatedAt,
    ];
  }

  async getProducts(): Promise<Product[]> {
    const rows = await this.getValues(SHEETS.products);
    return this.rowsToObjects(rows)
      .filter((r) => !!r.product_id)
      .map((r) => this.rowToProduct(r));
  }

  async createProduct(input: Omit<Product, "id" | "updatedAt">): Promise<Product> {
    const product: Product = { ...input, id: productId(), updatedAt: new Date().toISOString() };
    await this.request(`/values/${SHEETS.products}:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      body: JSON.stringify({ values: [this.productToRow(product)] }),
    });
    return product;
  }

  async updateProduct(id: string, patch: Partial<Omit<Product, "id">>): Promise<Product> {
    const all = await this.getProducts();
    const current = all.find((p) => p.id === id);
    if (!current) throw new Error(`Produto ${id} não encontrado`);
    const updated: Product = {
      ...current,
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    const rowIdx = await this.findRowIndex(SHEETS.products, "product_id", id);
    await this.request(
      `/values/${SHEETS.products}!A${rowIdx}:${columnLetter(PRODUCT_HEADERS.length)}${rowIdx}?valueInputOption=USER_ENTERED`,
      { method: "PUT", body: JSON.stringify({ values: [this.productToRow(updated)] }) },
    );
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.deleteRow(SHEETS.products, "product_id", id);
  }

  // ---------------------------------------------------------------------
  // categories
  // ---------------------------------------------------------------------

  async getCategories(): Promise<Category[]> {
    const rows = await this.getValues(SHEETS.categories);
    return this.rowsToObjects(rows)
      .filter((r) => !!r.category_id)
      .map((r) => ({ id: r.category_id, name: r.name, emoji: r.emoji || undefined }));
  }

  async createCategory(name: string): Promise<Category> {
    const existing = await this.getCategories();
    const found = existing.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) return found;

    const category: Category = { id: categoryId(name), name };
    await this.request(`/values/${SHEETS.categories}:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      body: JSON.stringify({ values: [[category.id, category.name, ""]] }),
    });
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.deleteRow(SHEETS.categories, "category_id", id);
  }

  // ---------------------------------------------------------------------
  // locations
  // ---------------------------------------------------------------------

  async getLocations(): Promise<Location[]> {
    const rows = await this.getValues(SHEETS.locations);
    return this.rowsToObjects(rows)
      .filter((r) => !!r.location_id)
      .map((r) => ({ id: r.location_id, name: r.name }));
  }

  async createLocation(name: string): Promise<Location> {
    const existing = await this.getLocations();
    const found = existing.find((l) => l.name.toLowerCase() === name.toLowerCase());
    if (found) return found;

    const location: Location = { id: locationId(name), name };
    await this.request(`/values/${SHEETS.locations}:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      body: JSON.stringify({ values: [[location.id, location.name]] }),
    });
    return location;
  }

  async deleteLocation(id: string): Promise<void> {
    await this.deleteRow(SHEETS.locations, "location_id", id);
  }
}

/** Converts a 1-indexed column number to its A1 letter (1 -> A, 14 -> N, 27 -> AA). */
function columnLetter(n: number): string {
  let s = "";
  let num = n;
  while (num > 0) {
    const rem = (num - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}
