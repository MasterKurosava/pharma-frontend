import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createOrder, deleteOrder, updateOrder, updateOrdersBatchStatus } from "@/entities/order/api/order-api";
import type { ActionStatusCode, PaymentStatusCode, StateStatusCode } from "@/shared/config/order-static";
import type { Order, OrderCreateDto, OrderUpdateDto } from "@/entities/order/api/order-types";
import { ordersQueryKeys } from "@/shared/api/query-keys/orders";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import {
  applyOrderPatch,
  buildOptimisticOrder,
  getOrderListSnapshots,
  type OrderListSnapshot,
  patchOrderInLists,
  prependOptimisticOrderToLists,
  removeOrderFromLists,
  restoreOrderListSnapshots,
} from "@/features/orders/model/order-cache-helpers";

type OrderMutationContext = {
  listSnapshots: OrderListSnapshot[];
  detailSnapshot?: Order;
  detailSnapshots?: Map<number | string, Order>;
  id?: number | string;
  temporaryId?: number;
};

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number | string; dto: OrderUpdateDto }) => updateOrder(payload.id, payload.dto),
    onMutate: async ({ id, dto }): Promise<OrderMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.detail(id), exact: true });
      const listSnapshots = getOrderListSnapshots(queryClient, ordersQueryKeys.lists());
      const detailSnapshot = queryClient.getQueryData<Order>(ordersQueryKeys.detail(id));
      patchOrderInLists(queryClient, ordersQueryKeys.lists(), id, dto);
      if (detailSnapshot) {
        queryClient.setQueryData<Order>(ordersQueryKeys.detail(id), (old) =>
          old ? applyOrderPatch(old, dto) : old,
        );
      }
      return { listSnapshots, detailSnapshot, id };
    },
    onSuccess: (order) => {
      queryClient.setQueryData(ordersQueryKeys.detail(order.id), order);
      patchOrderInLists(queryClient, ordersQueryKeys.lists(), order.id, order);
    },
    onError: (error, _variables, context) => {
      restoreOrderListSnapshots(queryClient, context?.listSnapshots ?? []);
      if (context?.id && context.detailSnapshot) {
        queryClient.setQueryData(ordersQueryKeys.detail(context.id), context.detailSnapshot);
      }
      toast.error(getApiErrorMessage(error, "Failed to save order"));
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: OrderCreateDto) => createOrder(dto),
    onMutate: async (dto): Promise<OrderMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      const listSnapshots = getOrderListSnapshots(queryClient, ordersQueryKeys.lists());
      const temporaryId = -Date.now();
      const optimisticOrder = buildOptimisticOrder(dto, temporaryId);
      prependOptimisticOrderToLists(queryClient, ordersQueryKeys.lists(), optimisticOrder);
      return { listSnapshots, temporaryId };
    },
    onSuccess: (order, _variables, context) => {
      queryClient.setQueryData(ordersQueryKeys.detail(order.id), order);
      const maybeTempId = context?.temporaryId;
      if (typeof maybeTempId === "number") {
        removeOrderFromLists(queryClient, ordersQueryKeys.lists(), maybeTempId);
      } else {
        removeOrderFromLists(queryClient, ordersQueryKeys.lists(), order.id);
      }
      prependOptimisticOrderToLists(queryClient, ordersQueryKeys.lists(), order);
    },
    onError: (error, _variables, context) => {
      restoreOrderListSnapshots(queryClient, context?.listSnapshots ?? []);
      toast.error(getApiErrorMessage(error, "Failed to create order"));
    },
  });
}

export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteOrder(id),
    onMutate: async (id): Promise<OrderMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.detail(id), exact: true });
      const listSnapshots = getOrderListSnapshots(queryClient, ordersQueryKeys.lists());
      const detailSnapshot = queryClient.getQueryData<Order>(ordersQueryKeys.detail(id));
      removeOrderFromLists(queryClient, ordersQueryKeys.lists(), id);
      queryClient.removeQueries({ queryKey: ordersQueryKeys.detail(id), exact: true });
      return { listSnapshots, detailSnapshot, id };
    },
    onError: (error, _id, context) => {
      restoreOrderListSnapshots(queryClient, context?.listSnapshots ?? []);
      if (context?.id && context.detailSnapshot) {
        queryClient.setQueryData(ordersQueryKeys.detail(context.id), context.detailSnapshot);
      }
      toast.error(getApiErrorMessage(error, "Failed to delete order"));
    },
  });
}

type UpdateSingleOrderStatusPayload = {
  id: number | string;
  dto: {
    actionStatusCode?: ActionStatusCode;
    stateStatusCode?: StateStatusCode;
    assemblyStatusCode?: string;
    paymentStatus?: PaymentStatusCode;
  };
};

export function useOptimisticUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: UpdateSingleOrderStatusPayload) => updateOrder(id, dto),
    onMutate: async ({ id, dto }): Promise<OrderMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.detail(id), exact: true });
      const listSnapshots = getOrderListSnapshots(queryClient, ordersQueryKeys.lists());
      const detailSnapshot = queryClient.getQueryData<Order>(ordersQueryKeys.detail(id));
      patchOrderInLists(queryClient, ordersQueryKeys.lists(), id, dto);
      if (detailSnapshot) {
        queryClient.setQueryData<Order>(ordersQueryKeys.detail(id), (old) =>
          old ? applyOrderPatch(old, dto) : old,
        );
      }
      return { listSnapshots, detailSnapshot, id };
    },
    onSuccess: (order) => {
      queryClient.setQueryData(ordersQueryKeys.detail(order.id), order);
      patchOrderInLists(queryClient, ordersQueryKeys.lists(), order.id, order);
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
    },
    onError: (error, _variables, context) => {
      restoreOrderListSnapshots(queryClient, context?.listSnapshots ?? []);
      if (context?.id && context.detailSnapshot) {
        queryClient.setQueryData(ordersQueryKeys.detail(context.id), context.detailSnapshot);
      }
      toast.error(getApiErrorMessage(error, "Не удалось обновить заказ"));
    },
  });
}

type UpdateManyOrdersStatusPayload = {
  orderIds: number[];
  dto: {
    actionStatusCode?: ActionStatusCode;
    stateStatusCode?: StateStatusCode;
    paymentStatus?: PaymentStatusCode;
  };
};

export function useOptimisticBulkUpdateOrdersStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    onMutate: async ({ orderIds, dto }): Promise<OrderMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
      const listSnapshots = getOrderListSnapshots(queryClient, ordersQueryKeys.lists());
      const detailSnapshots = new Map<number | string, Order>();
      for (const id of orderIds) {
        const detail = queryClient.getQueryData<Order>(ordersQueryKeys.detail(id));
        if (detail) {
          detailSnapshots.set(id, detail);
          queryClient.setQueryData<Order>(ordersQueryKeys.detail(id), (old) =>
            old ? applyOrderPatch(old, dto) : old,
          );
        }
        patchOrderInLists(queryClient, ordersQueryKeys.lists(), id, dto);
      }
      return { listSnapshots, detailSnapshots };
    },
    mutationFn: async ({ orderIds, dto }: UpdateManyOrdersStatusPayload) => {
      const result = await updateOrdersBatchStatus({ ids: orderIds, ...dto });
      return result.updatedCount;
    },
    onSuccess: (count) => {
      toast.success(`Обновлено заказов: ${count}`);
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists(), exact: false });
    },
    onError: (error, _variables, context) => {
      restoreOrderListSnapshots(queryClient, context?.listSnapshots ?? []);
      const detailMap = context?.detailSnapshots;
      if (detailMap instanceof Map) {
        for (const [id, snapshot] of detailMap.entries()) {
          queryClient.setQueryData(ordersQueryKeys.detail(id), snapshot);
        }
      }
      toast.error(getApiErrorMessage(error, "Не удалось обновить выбранные заказы"));
    },
  });
}
