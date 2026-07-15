import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSheetProvider } from "@/application/repositoryProvider";
import type { Product } from "@/domain/types";

const repo = () => getSheetProvider();

export const qk = {
  products: ["products"] as const,
  categories: ["categories"] as const,
  locations: ["locations"] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: qk.products,
    queryFn: () => repo().getProducts(),
    staleTime: 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: () => repo().getCategories(),
    staleTime: 10 * 60_000,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: qk.locations,
    queryFn: () => repo().getLocations(),
    staleTime: 10 * 60_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Product, "id" | "updatedAt">) => repo().createProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.products }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Product, "id">> }) =>
      repo().updateProduct(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.products });
      const previous = qc.getQueryData<Product[]>(qk.products);
      qc.setQueryData<Product[]>(qk.products, (old) =>
        old?.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      return { previous };
    },
    onError: (e: Error, _vars, context) => {
      toast.error(e.message);
      if (context?.previous) qc.setQueryData(qk.products, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.products }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo().deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.products }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (product: Product) =>
      repo().updateProduct(product.id, { favorite: !product.favorite }),
    onMutate: async (product) => {
      await qc.cancelQueries({ queryKey: qk.products });
      const previous = qc.getQueryData<Product[]>(qk.products);
      qc.setQueryData<Product[]>(qk.products, (old) =>
        old?.map((p) => (p.id === product.id ? { ...p, favorite: !p.favorite } : p)),
      );
      return { previous };
    },
    onError: (e: Error, _vars, context) => {
      toast.error(e.message);
      if (context?.previous) qc.setQueryData(qk.products, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.products }),
  });
}

export function useSetInCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, inCart }: { id: string; inCart: boolean }) =>
      repo().updateProduct(id, { inCart }),
    onMutate: async ({ id, inCart }) => {
      await qc.cancelQueries({ queryKey: qk.products });
      const previous = qc.getQueryData<Product[]>(qk.products);
      qc.setQueryData<Product[]>(qk.products, (old) =>
        old?.map((p) => (p.id === id ? { ...p, inCart } : p)),
      );
      return { previous };
    },
    onError: (e: Error, _vars, context) => {
      toast.error(e.message);
      if (context?.previous) qc.setQueryData(qk.products, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.products }),
  });
}

const DEBOUNCE_MS = 600;
const pendingSyncs = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Incrementos de quantidade acontecem em sequência rápida (toques de +/-).
 * O cache é atualizado na hora para manter a sensação tátil; a escrita real na
 * planilha é debounced para não estourar a cota da Sheets API nem esperar a
 * latência de rede a cada toque.
 */
export function useIncrementProduct() {
  const qc = useQueryClient();

  const flush = useCallback(
    (id: string) => {
      const timeout = pendingSyncs.get(id);
      if (!timeout) return;
      clearTimeout(timeout);
      pendingSyncs.delete(id);
      const current = qc.getQueryData<Product[]>(qk.products)?.find((p) => p.id === id);
      if (!current) return;
      repo()
        .updateProduct(id, { quantity: current.quantity })
        .catch((e: Error) => {
          toast.error(e.message);
          qc.invalidateQueries({ queryKey: qk.products });
        });
    },
    [qc],
  );

  useEffect(() => {
    const flushAll = () => pendingSyncs.forEach((_, id) => flush(id));
    document.addEventListener("visibilitychange", flushAll);
    window.addEventListener("beforeunload", flushAll);
    return () => {
      document.removeEventListener("visibilitychange", flushAll);
      window.removeEventListener("beforeunload", flushAll);
    };
  }, [flush]);

  return useCallback(
    (id: string, delta: number) => {
      qc.setQueryData<Product[]>(qk.products, (old) =>
        old?.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p)),
      );
      const existing = pendingSyncs.get(id);
      if (existing) clearTimeout(existing);
      pendingSyncs.set(
        id,
        setTimeout(() => flush(id), DEBOUNCE_MS),
      );
    },
    [qc, flush],
  );
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => repo().createCategory(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo().deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => repo().createLocation(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.locations }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo().deleteLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.locations }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function needsShopping(p: Product): boolean {
  return p.quantity < p.minQuantity;
}
