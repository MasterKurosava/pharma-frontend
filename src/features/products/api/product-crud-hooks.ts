import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createProduct, getProductById, getProducts, updateProduct, deleteProduct } from "@/entities/product/api/product-api";
import type { CreateProductDto, ProductListParams, UpdateProductDto } from "@/entities/product/api/product-types";
import { productsQueryKeys } from "@/shared/api/query-keys/products";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

const PRODUCT_STALE_TIME_MS = 3 * 60 * 1000;
const PRODUCT_GC_TIME_MS = 45 * 60 * 1000;

function toListParams(params: ProductListParams | undefined) {
  if (!params) return undefined;
  return {
    search: params.search,
    manufacturerId: params.manufacturerId,
    activeSubstanceId: params.activeSubstanceId,
    availabilityStatus: params.availabilityStatus,
    productOrderSourceId: params.productOrderSourceId,
    isActive: params.isActive,
  };
}

export function useProductsQuery(params?: ProductListParams) {
  return useQuery({
    queryKey: productsQueryKeys.list(toListParams(params)),
    queryFn: () => getProducts(params),
    retry: false,
    staleTime: PRODUCT_STALE_TIME_MS,
    gcTime: PRODUCT_GC_TIME_MS,
  });
}

export function useProductDetailQuery(productId: number | string | undefined) {
  return useQuery({
    queryKey: typeof productId === "undefined" ? productsQueryKeys.detail(0) : productsQueryKeys.detail(productId),
    queryFn: () => getProductById(productId ?? ""),
    enabled: Boolean(productId),
    retry: false,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProductDto) => createProduct(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists(), exact: false });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create product"));
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: UpdateProductDto }) => updateProduct(payload.id, payload.dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists(), exact: false });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.id), exact: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update product"));
    },
  });
}


export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteProduct(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists(), exact: false }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id), exact: true }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete product"));
    },
  });
}
