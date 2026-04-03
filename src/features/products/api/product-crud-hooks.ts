import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createProduct, getProductById, getProducts, updateProduct, deleteProduct } from "@/entities/product/api/product-api";
import type { CreateProductDto, Product, ProductListParams, UpdateProductDto } from "@/entities/product/api/product-types";
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

type ProductOptimisticContext = {
  listSnapshots: Array<readonly [readonly unknown[], Product[] | undefined]>;
  detailSnapshot?: Product;
  id?: number | string;
  temporaryId?: number;
};

function isSameId(left: number | string, right: number | string) {
  return String(left) === String(right);
}

function getProductListSnapshots(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.getQueriesData<Product[]>({
    queryKey: productsQueryKeys.lists(),
    exact: false,
  });
}

function restoreProductListSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: Array<readonly [readonly unknown[], Product[] | undefined]>,
) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

function upsertProductInList(
  list: Product[] | undefined,
  product: Product,
  temporaryId?: number,
): Product[] {
  const current = list ?? [];
  if (typeof temporaryId === "number") {
    let replaced = false;
    const mapped = current.map((item) => {
      if (!isSameId(item.id, temporaryId)) return item;
      replaced = true;
      return product;
    });
    if (replaced) return mapped;
  }

  const exists = current.some((item) => isSameId(item.id, product.id));
  return exists ? current : [product, ...current];
}

function applyProductPatch(product: Product, dto: UpdateProductDto): Product {
  const next: Product = { ...product, ...dto };
  const stockQuantity = dto.stockQuantity ?? product.stockQuantity;
  const reservedQuantity = dto.reservedQuantity ?? product.reservedQuantity;
  next.availableQuantity = Math.max(0, stockQuantity - reservedQuantity);
  return next;
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
    onMutate: async (dto): Promise<ProductOptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: productsQueryKeys.lists(), exact: false });

      const listSnapshots = getProductListSnapshots(queryClient);
      const temporaryId = -Date.now();
      const nowIso = new Date().toISOString();
      const optimisticProduct: Product = {
        id: temporaryId,
        name: dto.name,
        manufacturerId: dto.manufacturerId,
        activeSubstanceId: dto.activeSubstanceId,
        availabilityStatus: dto.availabilityStatus,
        availabilityStatusLabel: dto.availabilityStatus,
        productOrderSourceId: dto.productOrderSourceId,
        isActive: dto.isActive,
        stockQuantity: dto.stockQuantity,
        reservedQuantity: dto.reservedQuantity,
        availableQuantity: Math.max(0, dto.stockQuantity - dto.reservedQuantity),
        imageUrl: dto.imageUrl ?? null,
        description: dto.description ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      queryClient.setQueriesData<Product[]>(
        { queryKey: productsQueryKeys.lists(), exact: false },
        (old) => [optimisticProduct, ...(old ?? [])],
      );

      return { listSnapshots, temporaryId };
    },
    onSuccess: (createdProduct, _variables, context) => {
      queryClient.setQueryData(productsQueryKeys.detail(createdProduct.id), createdProduct);
      queryClient.setQueriesData<Product[]>(
        { queryKey: productsQueryKeys.lists(), exact: false },
        (old) => upsertProductInList(old, createdProduct, context?.temporaryId),
      );
    },
    onError: (error, _variables, context) => {
      restoreProductListSnapshots(queryClient, context?.listSnapshots ?? []);
      toast.error(getApiErrorMessage(error, "Failed to create product"));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists(), exact: false });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: UpdateProductDto }) => updateProduct(payload.id, payload.dto),
    onMutate: async ({ id, dto }): Promise<ProductOptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: productsQueryKeys.lists(), exact: false });
      await queryClient.cancelQueries({ queryKey: productsQueryKeys.detail(id), exact: true });

      const listSnapshots = getProductListSnapshots(queryClient);
      const detailSnapshot = queryClient.getQueryData<Product>(productsQueryKeys.detail(id));

      queryClient.setQueriesData<Product[]>(
        { queryKey: productsQueryKeys.lists(), exact: false },
        (old) => old?.map((item) => (isSameId(item.id, id) ? applyProductPatch(item, dto) : item)) ?? old,
      );

      if (detailSnapshot) {
        queryClient.setQueryData<Product>(productsQueryKeys.detail(id), applyProductPatch(detailSnapshot, dto));
      }

      return { listSnapshots, detailSnapshot, id };
    },
    onSuccess: (updatedProduct, variables) => {
      queryClient.setQueryData(productsQueryKeys.detail(variables.id), updatedProduct);
      queryClient.setQueryData(productsQueryKeys.detail(updatedProduct.id), updatedProduct);
      queryClient.setQueriesData<Product[]>(
        { queryKey: productsQueryKeys.lists(), exact: false },
        (old) => old?.map((item) => (isSameId(item.id, updatedProduct.id) ? { ...item, ...updatedProduct } : item)) ?? old,
      );
    },
    onError: (error, _variables, context) => {
      restoreProductListSnapshots(queryClient, context?.listSnapshots ?? []);
      if (context?.id && context.detailSnapshot) {
        queryClient.setQueryData(productsQueryKeys.detail(context.id), context.detailSnapshot);
      }
      toast.error(getApiErrorMessage(error, "Failed to update product"));
    },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists(), exact: false }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(variables.id), exact: true }),
      ]);
    },
  });
}


export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteProduct(id),
    onMutate: async (id): Promise<ProductOptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: productsQueryKeys.lists(), exact: false });
      await queryClient.cancelQueries({ queryKey: productsQueryKeys.detail(id), exact: true });

      const listSnapshots = getProductListSnapshots(queryClient);
      const detailSnapshot = queryClient.getQueryData<Product>(productsQueryKeys.detail(id));

      queryClient.setQueriesData<Product[]>(
        { queryKey: productsQueryKeys.lists(), exact: false },
        (old) => old?.filter((item) => !isSameId(item.id, id)) ?? old,
      );
      queryClient.removeQueries({ queryKey: productsQueryKeys.detail(id), exact: true });

      return { listSnapshots, detailSnapshot, id };
    },
    onError: (error, _id, context) => {
      restoreProductListSnapshots(queryClient, context?.listSnapshots ?? []);
      if (context?.id && context.detailSnapshot) {
        queryClient.setQueryData(productsQueryKeys.detail(context.id), context.detailSnapshot);
      }
      toast.error(getApiErrorMessage(error, "Failed to delete product"));
    },
    onSettled: async (_data, _error, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists(), exact: false }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id), exact: true }),
      ]);
    },
  });
}
