import { apiClient } from "@/shared/api/client";

import type {
  Order,
  OrderCreateDto,
  OrdersListParams,
  OrderStatsSummary,
  OrderUpdateDto,
  OrdersListResponse,
} from "@/entities/order/api/order-types";
import type { ActionStatusCode, PaymentStatusCode, StateStatusCode } from "@/shared/config/order-static";

export async function getOrders(params: OrdersListParams): Promise<OrdersListResponse> {
  const normalizedParams = {
    ...params,
    actionStatusCodes: params.actionStatusCodes?.length ? params.actionStatusCodes.join(",") : undefined,
  };
  const { data } = await apiClient.get<OrdersListResponse>("/orders", { params: normalizedParams });
  return data;
}

export async function getOrderStatsSummary(): Promise<OrderStatsSummary> {
  const { data } = await apiClient.get<OrderStatsSummary>("/orders/stats/summary");
  return data;
}

export async function getOrderById(id: number | string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
}

export async function createOrder(dto: OrderCreateDto): Promise<Order> {
  const { data } = await apiClient.post<Order>("/orders", dto);
  return data;
}

export async function updateOrder(id: number | string, dto: OrderUpdateDto): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}`, dto);
  return data;
}

export async function deleteOrder(id: number | string): Promise<void> {
  await apiClient.delete(`/orders/${id}`);
}

export async function updateOrdersBatchStatus(payload: {
  ids: number[];
  actionStatusCode?: ActionStatusCode;
  stateStatusCode?: StateStatusCode;
  paymentStatus?: PaymentStatusCode;
}): Promise<{ updatedCount: number }> {
  const { data } = await apiClient.patch<{ updatedCount: number }>("/orders/batch/status", payload);
  return data;
}
