import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createOrder, updateOrder, deleteOrder } from "@/entities/order/api/order-api";
import type { OrderCreateDto, OrderUpdateDto, OrdersListResponse } from "@/entities/order/api/order-types";
import { ordersQueryKeys } from "@/shared/api/query-keys/orders";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

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
