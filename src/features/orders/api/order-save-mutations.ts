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

function applyPatchToOrder(order: Order, patch: OptimisticOrderPatchDto): Order {
  const next: Order = { ...order, ...patch };
  if (typeof patch.paidAmount === "number") {
    const totalPrice = Number(order.totalPrice ?? 0);
    next.remainingAmount = Math.max(0, totalPrice - patch.paidAmount);
  }
  return next;
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

  queryClient.setQueriesData<OrdersListResponse>(
    { queryKey: ordersQueryKeys.lists(), exact: false },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) =>
          targetIds.has(String(item.id)) ? applyPatchToOrder(item, patch) : item,
        ),
      };
    },
  );

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

      queryClient.setQueriesData<OrdersListResponse>(
        { queryKey: ordersQueryKeys.lists(), exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              String(item.id) === String(updatedOrder.id) ? { ...item, ...updatedOrder } : item,
            ),
          };
        },
      );

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
      queryClient.setQueriesData<OrdersListResponse>(
        { queryKey: ordersQueryKeys.lists(), exact: false },
        (old) => {
          if (!old) return old;
          if (!context) {
            return { ...old, items: [createdOrder, ...old.items] };
          }
          const replaced = old.items.some((item) => item.id === context.temporaryOrderId);
          return {
            ...old,
            items: replaced
              ? old.items.map((item) => (item.id === context.temporaryOrderId ? createdOrder : item))
              : [createdOrder, ...old.items],
          };
        },
      );
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
