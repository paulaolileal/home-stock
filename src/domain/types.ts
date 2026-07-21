export type Product = {
  id: string;
  name: string;
  categoryId: string;
  locationId: string;
  quantity: number;
  minQuantity: number;
  idealQuantity: number;
  unit: string;
  notes?: string;
  barcode?: string;
  image?: string;
  favorite: boolean;
  inCart?: boolean;
  updatedAt: string;
};

export type Category = { id: string; name: string; emoji?: string };
export type Location = { id: string; name: string };
