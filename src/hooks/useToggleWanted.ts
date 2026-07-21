import { useUpdateProduct } from "@/hooks/queries";
import { useShoppingListStore } from "@/store/shoppingListStore";
import type { Product } from "@/domain/types";

/**
 * Toggles whether a product is manually requested for the next shopping trip
 * (independent of its stock minimum). When added, pre-fills the amount to buy
 * on the shopping list with the product's ideal quantity.
 */
export function useToggleWanted() {
  const updateProduct = useUpdateProduct();
  const setTarget = useShoppingListStore((s) => s.setTarget);
  const clearTarget = useShoppingListStore((s) => s.clearTarget);

  return (product: Product) => {
    const wanted = !product.wanted;
    updateProduct.mutate({ id: product.id, patch: { wanted } });
    if (wanted) setTarget(product.id, product.idealQuantity);
    else clearTarget(product.id);
  };
}
