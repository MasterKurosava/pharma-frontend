import { apiClient } from "@/shared/api/client";

import type {
  Order,
  OrderCreateDto,
  OrderHistoryItem,
  OrdersListParams,
  OrderStatsSummary,
  OrderUpdateDto,
  OrdersListResponse,
} from "@/entities/order/api/order-types";

export async function getOrders(params: OrdersListParams): Promise<OrdersListResponse> {
  const { data } = await apiClient.get<OrdersListResponse>("/orders", { params });
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

export async function getOrderHistory(id: number | string): Promise<OrderHistoryItem[]> {
  const { data } = await apiClient.get<OrderHistoryItem[]>(`/orders/${id}/history`);
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

