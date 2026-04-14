import { apiClient } from "@/shared/api/client";
import type { OrderStatusConfigItem, UpdateOrderStatusConfigDto } from "./order-status-types";
import type { OrderStatusType } from "@/shared/config/order-static";

export async function getOrderStatusConfigs(type?: OrderStatusType): Promise<OrderStatusConfigItem[]> {
  const { data } = await apiClient.get<OrderStatusConfigItem[]>("/order-status-configs", {
    params: type ? { type } : undefined,
  });
  return data;
}

export async function updateOrderStatusConfig(
  id: number,
  dto: UpdateOrderStatusConfigDto,
): Promise<OrderStatusConfigItem> {
  const { data } = await apiClient.patch<OrderStatusConfigItem>(
    `/order-status-configs/${id}`,
    dto,
  );
  return data;
}
