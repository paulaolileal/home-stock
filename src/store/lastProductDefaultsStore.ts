import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LastProductDefaultsState {
  categoryId?: string;
  locationId?: string;
  setLastProductDefaults: (categoryId: string, locationId: string) => void;
}

/**
 * Última categoria/local usados ao criar um produto, para pré-selecionar no
 * próximo cadastro (ex.: várias compras seguidas do mesmo corredor/mercado).
 */
export const useLastProductDefaultsStore = create<LastProductDefaultsState>()(
  persist(
    (set) => ({
      categoryId: undefined,
      locationId: undefined,
      setLastProductDefaults: (categoryId, locationId) => set({ categoryId, locationId }),
    }),
    { name: "homestock:last-product-defaults" },
  ),
);
