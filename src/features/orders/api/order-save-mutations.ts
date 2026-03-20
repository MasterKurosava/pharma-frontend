import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateOrder, deleteOrder } from "@/entities/order/api/order-api";
import type { OrderUpdateDto } from "@/entities/order/api/order-types";
import { ordersQueryKeys } from "@/shared/api/query-keys/orders";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: OrderUpdateDto }) =>
      updateOrder(payload.id, payload.dto),
    onSuccess: async (_data, variables) => {
      const orderId = variables.id;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId), exact: true }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.history(orderId), exact: true }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists(), exact: false }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to save order"));
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
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.history(id), exact: true }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete order"));
    },
  });
}
