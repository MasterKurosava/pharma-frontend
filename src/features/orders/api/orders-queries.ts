import { useQuery } from "@tanstack/react-query";

import { getOrderById, getOrders, getOrderHistory } from "@/entities/order/api/order-api";
import type { OrdersListParams, OrdersListResponse, Order, OrderHistoryItem } from "@/entities/order/api/order-types";
import { ordersQueryKeys } from "@/shared/api/query-keys/orders";

import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

function toSerializableParams(params: OrdersListParams): SerializableQueryParams {
  return {
    search: params.search,
    clientId: params.clientId,
    countryId: params.countryId,
    cityId: params.cityId,
    responsibleUserId: params.responsibleUserId,
    paymentStatusId: params.paymentStatusId,
    orderStatusId: params.orderStatusId,
    assemblyStatusId: params.assemblyStatusId,
    storagePlaceId: params.storagePlaceId,
    deliveryCompanyId: params.deliveryCompanyId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: params.page,
    pageSize: params.pageSize,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  } as unknown as SerializableQueryParams;
}

export function useOrdersListQuery(params: OrdersListParams) {
  return useQuery<OrdersListResponse>({
    queryKey: ordersQueryKeys.list(toSerializableParams(params)),
    queryFn: () => getOrders(params),
    retry: false,
  });
}

export function useOrderDetailQuery(orderId: number | string | undefined) {
  return useQuery<Order>({
    queryKey: typeof orderId === "undefined" ? ordersQueryKeys.detail(0) : ordersQueryKeys.detail(orderId),
    queryFn: () => getOrderById(orderId ?? ""),
    enabled: Boolean(orderId),
    retry: false,
  });
}

export function useOrderHistoryQuery(orderId: number | string | undefined) {
  return useQuery<OrderHistoryItem[]>({
    queryKey: typeof orderId === "undefined" ? ordersQueryKeys.history(0) : ordersQueryKeys.history(orderId),
    queryFn: () => getOrderHistory(orderId ?? ""),
    enabled: Boolean(orderId),
    retry: false,
  });
}

