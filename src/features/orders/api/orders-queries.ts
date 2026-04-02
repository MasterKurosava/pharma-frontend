import { useQuery } from "@tanstack/react-query";

import { getOrderById, getOrders } from "@/entities/order/api/order-api";
import type { OrdersListParams, OrdersListResponse, Order } from "@/entities/order/api/order-types";
import { ordersQueryKeys } from "@/shared/api/query-keys/orders";

import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

function toSerializableParams(params: OrdersListParams): SerializableQueryParams {
  return {
    search: params.search,
    clientPhone: params.clientPhone,
    countryId: params.countryId,
    city: params.city,
    paymentStatus: params.paymentStatus,
    orderStatus: params.orderStatus,
    orderStatuses: params.orderStatuses?.join(","),
    storagePlaceId: params.storagePlaceId,
    deliveryStatus: params.deliveryStatus,
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

