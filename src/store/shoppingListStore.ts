import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShoppingListState {
  targetQuantities: Record<string, number>;
  setTarget: (productId: string, quantity: number) => void;
  clearTarget: (productId: string) => void;
}

/**
 * Quanto o usuário pretende comprar de cada produto nesta ida ao mercado.
 * É um valor local e efêmero (não vai para a planilha): pode ser maior que o
 * necessário para repor o mínimo, ex. comprar 3 unidades para uma ocasião
 * específica quando só falta 1 para o ideal.
 */
export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set) => ({
      targetQuantities: {},
      setTarget: (productId, quantity) =>
        set((s) => ({ targetQuantities: { ...s.targetQuantities, [productId]: quantity } })),
      clearTarget: (productId) =>
        set((s) => {
          const { [productId]: _removed, ...rest } = s.targetQuantities;
          return { targetQuantities: rest };
        }),
    }),
    { name: "homestock:shopping-list-targets" },
  ),
);
