import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createOrder, updateOrder, deleteOrder, updateOrdersBatchStatus } from "@/entities/order/api/order-api";
import type { Order, OrderCreateDto, OrderUpdateDto, OrdersListResponse } from "@/entities/order/api/order-types";
import { ordersQueryKeys } from "@/shared/api/query-keys/orders";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import type { DeliveryStatusCode, OrderStatusCode, PaymentStatusCode } from "@/shared/config/order-static";

type OptimisticOrderPatchDto = Partial<
  Pick<OrderUpdateDto, "orderStatus" | "deliveryStatus" | "paymentStatus" | "paidAmount">
>;

type OptimisticContext = {
  listSnapshots: Array<readonly [readonly unknown[], OrdersListResponse | undefined]>;
  detailSnapshots: Array<readonly [readonly unknown[], Order | undefined]>;
};

type CreateOrderOptimisticContext = {
  listSnapshots: Array<readonly [readonly unknown[], OrdersListResponse | undefined]>;
  temporaryOrderId: number;
};

type DeleteOrderOptimisticContext = {
  listSnapshots: Array<readonly [readonly unknown[], OrdersListResponse | undefined]>;
  detailSnapshot?: Order;
  orderId: number | string;
};

type OrdersListFilter = {
  orderStatus?: string;
  orderStatuses?: string[];
  deliveryStatus?: string;
  paymentStatus?: string;
};

function applyPatchToOrder(order: Order, patch: OptimisticOrderPatchDto): Order {
  const next: Order = { ...order, ...patch };
  if (typeof patch.paidAmount === "number") {
    const totalPrice = Number(order.totalPrice ?? 0);
    next.remainingAmount = Math.max(0, totalPrice - patch.paidAmount);
  }
  return next;
}

function parseOrdersListFilter(queryKey: readonly unknown[]): OrdersListFilter {
  const serialized = queryKey.at(2);
  if (typeof serialized !== "string" || !serialized) return {};

  try {
    const raw = JSON.parse(serialized) as Record<string, unknown>;
    const orderStatuses =
      typeof raw.orderStatuses === "string"
        ? raw.orderStatuses
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : undefined;

    return {
      orderStatus: typeof raw.orderStatus === "string" ? raw.orderStatus : undefined,
      orderStatuses: orderStatuses?.length ? orderStatuses : undefined,
      deliveryStatus: typeof raw.deliveryStatus === "string" ? raw.deliveryStatus : undefined,
      paymentStatus: typeof raw.paymentStatus === "string" ? raw.paymentStatus : undefined,
    };
  } catch {
    return {};
  }
}

function matchesOrderFilter(order: Order, filter: OrdersListFilter): boolean {
  if (filter.orderStatus && order.orderStatus !== filter.orderStatus) return false;
  if (filter.orderStatuses?.length && !filter.orderStatuses.includes(String(order.orderStatus))) return false;
  if (filter.deliveryStatus && order.deliveryStatus !== filter.deliveryStatus) return false;
  if (filter.paymentStatus && order.paymentStatus !== filter.paymentStatus) return false;
  return true;
}

function mergeOrderIntoList(
  list: OrdersListResponse,
  order: Order,
  filter: OrdersListFilter,
): OrdersListResponse {
  const orderId = String(order.id);
  const existingIndex = list.items.findIndex((item) => String(item.id) === orderId);
  const shouldBeVisible = matchesOrderFilter(order, filter);

  if (existingIndex >= 0 && !shouldBeVisible) {
    const nextItems = list.items.filter((item) => String(item.id) !== orderId);
    return {
      ...list,
      items: nextItems,
      total: Math.max(0, list.total - 1),
    };
  }

  if (existingIndex >= 0) {
    const nextItems = list.items.map((item) => (String(item.id) === orderId ? { ...item, ...order } : item));
    return { ...list, items: nextItems };
  }

  if (!shouldBeVisible) {
    return list;
  }

  const nextItems = [order, ...list.items].slice(0, list.pageSize);
  return {
    ...list,
    items: nextItems,
    total: list.total + 1,
  };
}

function updateOrderInAllCachedLists(
  queryClient: ReturnType<typeof useQueryClient>,
  order: Order,
) {
  const listSnapshots = queryClient.getQueriesData<OrdersListResponse>({
    queryKey: ordersQueryKeys.lists(),
    exact: false,
  });

  for (const [key, data] of listSnapshots) {
    if (!data) continue;
    const filter = parseOrdersListFilter(key);
    queryClient.setQueryData<OrdersListResponse>(key, mergeOrderIntoList(data, order, filter));
  }
}

function applyOptimisticPatch(
  queryClient: ReturnType<typeof useQueryClient>,
  orderIds: Array<number | string>,
  patch: OptimisticOrderPatchDto,
): OptimisticContext {
  const targetIds = new Set(orderIds.map((id) => String(id)));
  const listSnapshots = queryClient.getQueriesData<OrdersListResponse>({
    queryKey: ordersQueryKeys.lists(),
    exact: false,
  });
  const detailSnapshots = orderIds.map((id) => {
    const key = ordersQueryKeys.detail(id);
    return [key, queryClient.getQueryData<Order>(key)] as const;
  });

  const detailById = new Map<string, Order>();
  for (const [, detail] of detailSnapshots) {
    if (detail) {
      detailById.set(String(detail.id), detail);
    }
  }

  for (const [key, list] of listSnapshots) {
    if (!list) continue;
    const filter = parseOrdersListFilter(key);
    let next = list;
    let changed = false;

    for (const item of list.items) {
      if (!targetIds.has(String(item.id))) continue;
      const patched = applyPatchToOrder(item, patch);
      const merged = mergeOrderIntoList(next, patched, filter);
      if (merged !== next) changed = true;
      next = merged;
      detailById.set(String(item.id), patched);
    }

    for (const [id, detail] of detailById) {
      if (!targetIds.has(id)) continue;
      const alreadyInList = next.items.some((item) => String(item.id) === id);
      if (alreadyInList) continue;
      const patched = applyPatchToOrder(detail, patch);
      const merged = mergeOrderIntoList(next, patched, filter);
      if (merged !== next) changed = true;
      next = merged;
    }

    if (changed) {
      queryClient.setQueryData<OrdersListResponse>(key, next);
    }
  }

  for (const [key, oldDetail] of detailSnapshots) {
    if (!oldDetail) continue;
    queryClient.setQueryData<Order>(key, applyPatchToOrder(oldDetail, patch));
  }

  return { listSnapshots, detailSnapshots };
}

function rollbackOptimisticPatch(
  queryClient: ReturnType<typeof useQueryClient>,
  context?: OptimisticContext,
) {
  if (!context) return;
  for (const [key, data] of context.listSnapshots) {
    queryClient.setQueryData(key, data);
  }
  for (const [key, data] of context.detailSnapshots) {
    queryClient.setQueryData(key, data);
  }
}

function buildOptimisticOrder(dto: OrderCreateDto, temporaryOrderId: number): Order {
  const paidAmount = dto.paidAmount ?? 0;
  const totalPrice = 0;
  return {
    id: temporaryOrderId,
    clientPhone: dto.clientPhone,
    countryId: dto.countryId,
    city: dto.city,
    address: dto.address,
    deliveryStatus: dto.deliveryStatus,
    deliveryPrice: dto.deliveryPrice ?? null,
    paymentStatus: dto.paymentStatus,
    orderStatus: dto.orderStatus,
    storagePlaceId: dto.storagePlaceId ?? null,
    description: dto.description,
    paidAmount,
    totalPrice,
    remainingAmount: Math.max(0, totalPrice - paidAmount),
    items: dto.items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itemsCount: dto.items.length,
  };
}

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: OrderUpdateDto }) =>
      updateOrder(payload.id, payload.dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.detail(id), exact: true });
      return applyOptimisticPatch(queryClient, [id], dto);
    },
    onSuccess: (updatedOrder, variables) => {
      const orderId = variables.id;

      queryClient.setQueryData(ordersQueryKeys.detail(orderId), updatedOrder);
      queryClient.setQueryData(ordersQueryKeys.detail(updatedOrder.id), updatedOrder);
      updateOrderInAllCachedLists(queryClient, updatedOrder);
    },
    onError: (error, _variables, context) => {
      rollbackOptimisticPatch(queryClient, context);
      toast.error(getApiErrorMessage(error, "Failed to save order"));
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: OrderCreateDto) => createOrder(dto),
    onMutate: async (dto): Promise<CreateOrderOptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      const listSnapshots = queryClient.getQueriesData<OrdersListResponse>({
        queryKey: ordersQueryKeys.lists(),
        exact: false,
      });
      const temporaryOrderId = -Date.now();
      const optimisticOrder = buildOptimisticOrder(dto, temporaryOrderId);

      queryClient.setQueryData(ordersQueryKeys.detail(temporaryOrderId), optimisticOrder);
      queryClient.setQueriesData<OrdersListResponse>(
        { queryKey: ordersQueryKeys.lists(), exact: false },
        (old) =>
          old
            ? {
                ...old,
                items: [optimisticOrder, ...old.items],
                total: old.total + 1,
              }
            : old,
      );

      return { listSnapshots, temporaryOrderId };
    },
    onSuccess: (createdOrder, _variables, context) => {
      if (context) {
        queryClient.removeQueries({ queryKey: ordersQueryKeys.detail(context.temporaryOrderId), exact: true });
      }
      queryClient.setQueryData(ordersQueryKeys.detail(createdOrder.id), createdOrder);
      updateOrderInAllCachedLists(queryClient, createdOrder);
    },
    onError: (error, _variables, context) => {
      for (const [key, data] of context?.listSnapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      if (context) {
        queryClient.removeQueries({ queryKey: ordersQueryKeys.detail(context.temporaryOrderId), exact: true });
      }
      toast.error(getApiErrorMessage(error, "Failed to create order"));
    },
  });
}


export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteOrder(id),
    onMutate: async (id): Promise<DeleteOrderOptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.detail(id), exact: true });

      const listSnapshots = queryClient.getQueriesData<OrdersListResponse>({
        queryKey: ordersQueryKeys.lists(),
        exact: false,
      });
      const detailSnapshot = queryClient.getQueryData<Order>(ordersQueryKeys.detail(id));

      queryClient.setQueriesData<OrdersListResponse>(
        { queryKey: ordersQueryKeys.lists(), exact: false },
        (old) => {
          if (!old) return old;
          const nextItems = old.items.filter((item) => String(item.id) !== String(id));
          return {
            ...old,
            items: nextItems,
            total: Math.max(0, old.total - (old.items.length - nextItems.length)),
          };
        },
      );
      queryClient.removeQueries({ queryKey: ordersQueryKeys.detail(id), exact: true });

      return { listSnapshots, detailSnapshot, orderId: id };
    },
    onError: (error, _id, context) => {
      for (const [key, data] of context?.listSnapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      if (context?.detailSnapshot) {
        queryClient.setQueryData(ordersQueryKeys.detail(context.orderId), context.detailSnapshot);
      }
      toast.error(getApiErrorMessage(error, "Failed to delete order"));
    },
  });
}

type UpdateSingleOrderStatusPayload = {
  id: number | string;
  dto: {
    orderStatus?: OrderStatusCode;
    deliveryStatus?: DeliveryStatusCode;
    paymentStatus?: PaymentStatusCode;
    paidAmount?: number;
  };
};

export function useOptimisticUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: UpdateSingleOrderStatusPayload) => updateOrder(id, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.detail(id), exact: true });
      return applyOptimisticPatch(queryClient, [id], dto);
    },
    onError: (error, _, context) => {
      rollbackOptimisticPatch(queryClient, context);
      toast.error(getApiErrorMessage(error, "Не удалось обновить заказ"));
    },
  });
}

type UpdateManyOrdersStatusPayload = {
  orderIds: number[];
  dto: {
    orderStatus?: OrderStatusCode;
    deliveryStatus?: DeliveryStatusCode;
    paymentStatus?: PaymentStatusCode;
  };
};

export function useOptimisticBulkUpdateOrdersStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderIds, dto }: UpdateManyOrdersStatusPayload) => {
      const result = await updateOrdersBatchStatus({
        ids: orderIds,
        ...dto,
      });
      return result.updatedCount;
    },
    onMutate: async ({ orderIds, dto }) => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      await Promise.all(
        orderIds.map((id) => queryClient.cancelQueries({ queryKey: ordersQueryKeys.detail(id), exact: true })),
      );
      return applyOptimisticPatch(queryClient, orderIds, dto);
    },
    onError: (error, _, context) => {
      rollbackOptimisticPatch(queryClient, context);
      toast.error(getApiErrorMessage(error, "Не удалось обновить выбранные заказы"));
    },
    onSuccess: (count) => {
      toast.success(`Обновлено заказов: ${count}`);
    },
  });
}
