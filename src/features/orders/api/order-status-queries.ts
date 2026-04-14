import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrderStatusConfigs, updateOrderStatusConfig } from "@/entities/order-status/api/order-status-api";
import type { OrderStatusType } from "@/shared/config/order-static";
import type { UpdateOrderStatusConfigDto } from "@/entities/order-status/api/order-status-types";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { toast } from "sonner";

export function useOrderStatusConfigsQuery(type?: OrderStatusType) {
  return useQuery({
    queryKey: ["order-status-configs", type ?? "all"],
    queryFn: () => getOrderStatusConfigs(type),
    staleTime: 60_000,
  });
}

export function useUpdateOrderStatusConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateOrderStatusConfigDto }) =>
      updateOrderStatusConfig(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["order-status-configs"] });
      toast.success("Статус обновлен");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось обновить статус"));
    },
  });
}
