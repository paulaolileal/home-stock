const OFF_API = "https://world.openfoodfacts.org/api/v2/product";

export interface OffProduct {
  name?: string;
  brand?: string;
  category?: string;
  image?: string;
}

interface OffResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    categories?: string;
    image_front_small_url?: string;
    image_url?: string;
  };
}

/**
 * Consulta pública da Open Food Facts, sem autenticação. Retorna `null` quando
 * o código não está catalogado ou a API falha — o chamador deve tratar isso
 * como "preencha manualmente", nunca como erro fatal.
 */
export async function lookupBarcode(barcode: string): Promise<OffProduct | null> {
  try {
    const res = await fetch(`${OFF_API}/${encodeURIComponent(barcode)}.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as OffResponse;
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    return {
      name: p.product_name || undefined,
      brand: p.brands?.split(",")[0]?.trim() || undefined,
      category: p.categories?.split(",")[0]?.trim() || undefined,
      image: p.image_front_small_url || p.image_url || undefined,
    };
  } catch {
    return null;
  }
}
