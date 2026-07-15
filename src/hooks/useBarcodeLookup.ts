import { useMutation } from "@tanstack/react-query";
import { lookupBarcode } from "@/infrastructure/openfoodfacts/OpenFoodFactsClient";

export function useBarcodeLookup() {
  return useMutation({
    mutationFn: (barcode: string) => lookupBarcode(barcode),
  });
}
