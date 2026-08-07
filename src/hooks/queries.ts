import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSheetProvider } from "@/application/repositoryProvider";
import type { Category, Location, Product } from "@/domain/types";
import { compareNames } from "@/lib/utils";
import { GoogleAuthError } from "@/infrastructure/google/googleApiFetch";

const repo = () => getSheetProvider();

/**
 * Shared `onError` for mutations. Session-expiry (`GoogleAuthError`) is already
 * surfaced once, globally, by the QueryClient's `mutationCache.onError` (see
 * main.tsx) with a persistent "Reconectar" toast — skip it here to avoid a
 * duplicate, generic-text toast on top of it.
 */
function onErrorToast(e: Error) {
  if (e instanceof GoogleAuthError) return;
  toast.error(e.message);
}

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
    select: (categories) => [...categories].sort((a, b) => compareNames(a.name, b.name)),
  });
}

export function useLocations() {
  return useQuery({
    queryKey: qk.locations,
    queryFn: () => repo().getLocations(),
    staleTime: 10 * 60_000,
    select: (locations) => [...locations].sort((a, b) => compareNames(a.name, b.name)),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Product, "id" | "updatedAt">) => repo().createProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.products }),
    onError: onErrorToast,
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
      onErrorToast(e);
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
    onError: onErrorToast,
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
      onErrorToast(e);
      if (context?.previous) qc.setQueryData(qk.products, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.products }),
  });
}

export function useSetInCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      inCart,
      quantity,
      wanted,
    }: {
      id: string;
      inCart: boolean;
      quantity?: number;
      wanted?: boolean;
    }) =>
      repo().updateProduct(id, {
        inCart,
        ...(quantity == null ? {} : { quantity }),
        ...(wanted == null ? {} : { wanted }),
      }),
    onMutate: async ({ id, inCart, quantity, wanted }) => {
      await qc.cancelQueries({ queryKey: qk.products });
      const previous = qc.getQueryData<Product[]>(qk.products);
      qc.setQueryData<Product[]>(qk.products, (old) =>
        old?.map((p) =>
          p.id === id
            ? {
                ...p,
                inCart,
                ...(quantity == null ? {} : { quantity }),
                ...(wanted == null ? {} : { wanted }),
              }
            : p,
        ),
      );
      return { previous };
    },
    onError: (e: Error, _vars, context) => {
      onErrorToast(e);
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
          onErrorToast(e);
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
    mutationFn: ({ name, emoji }: { name: string; emoji?: string }) =>
      repo().createCategory(name, emoji),
    onSuccess: (category) => {
      qc.setQueryData<Category[]>(qk.categories, (old) =>
        old?.some((c) => c.id === category.id) ? old : [...(old ?? []), category],
      );
    },
    onError: onErrorToast,
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, emoji }: { id: string; name?: string; emoji?: string }) =>
      repo().updateCategory(id, { name, emoji }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
    onError: onErrorToast,
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo().deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
    onError: onErrorToast,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => repo().createLocation(name),
    onSuccess: (location) => {
      qc.setQueryData<Location[]>(qk.locations, (old) =>
        old?.some((l) => l.id === location.id) ? old : [...(old ?? []), location],
      );
    },
    onError: onErrorToast,
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => repo().updateLocation(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.locations }),
    onError: onErrorToast,
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo().deleteLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.locations }),
    onError: onErrorToast,
  });
}

export function needsShopping(p: Product): boolean {
  return p.quantity < p.minQuantity;
}
