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

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: OrderUpdateDto }) =>
      updateOrder(payload.id, payload.dto),
    onSuccess: async (updatedOrder, variables) => {
      const orderId = variables.id;

      queryClient.setQueryData(ordersQueryKeys.detail(orderId), updatedOrder);
      queryClient.setQueryData(ordersQueryKeys.detail(updatedOrder.id), updatedOrder);

      queryClient.setQueriesData<OrdersListResponse>(
        { queryKey: ordersQueryKeys.lists(), exact: false },
        (old) => {
          if (!old) return old;

          const updatedId = String(updatedOrder.id ?? orderId);
          return {
            ...old,
            items: old.items.map((item) => (String(item.id) === updatedId ? { ...item, ...updatedOrder } : item)),
          };
        },
      );

      // Re-fetch all list variants so order can disappear/appear across filtered tabs (Delivery/Assembly).
      await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to save order"));
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: OrderCreateDto) => createOrder(dto),
    onSuccess: async (createdOrder) => {
      queryClient.setQueryData(ordersQueryKeys.detail(createdOrder.id), createdOrder);
      await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create order"));
    },
  });
}


export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteOrder(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists(), exact: false }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(id), exact: true }),
      ]);
    },
    onError: (error) => {
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
    onSettled: async (_, __, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists(), exact: false }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(variables.id), exact: true }),
      ]);
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
    onSettled: async (_, __, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists(), exact: false }),
        ...variables.orderIds.map((id) =>
          queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(id), exact: true }),
        ),
      ]);
    },
  });
}
