import { useQuery } from "@tanstack/react-query";

import { getOrderById, getOrders } from "@/entities/order/api/order-api";
import type { OrdersListParams, OrdersListResponse, Order } from "@/entities/order/api/order-types";
import { ordersQueryKeys } from "@/shared/api/query-keys/orders";

import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

function toSerializableParams(params: OrdersListParams): SerializableQueryParams {
  return {
    search: params.search,
    clientPhone: params.clientPhone,
    tableGroup: params.tableGroup,
    city: params.city,
    paymentStatus: params.paymentStatus,
    actionStatusCode: params.actionStatusCode,
    actionStatusCodes: params.actionStatusCodes?.join(","),
    storagePlaceId: params.storagePlaceId,
    stateStatusCode: params.stateStatusCode,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: params.page,
    pageSize: params.pageSize,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
}

export function useOrdersListQuery(params: OrdersListParams) {
  return useQuery<OrdersListResponse>({
    queryKey: ordersQueryKeys.list(toSerializableParams(params)),
    queryFn: () => getOrders(params),
    retry: false,
  });
}

export function useOrderDetailQuery(orderId: number | string | undefined) {
  const resolvedOrderId = orderId ?? 0;
  return useQuery<Order>({
    queryKey: ordersQueryKeys.detail(resolvedOrderId),
    queryFn: () => getOrderById(resolvedOrderId),
    enabled: Boolean(orderId),
    retry: false,
  });
}

