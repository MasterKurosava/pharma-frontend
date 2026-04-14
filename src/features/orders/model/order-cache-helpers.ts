import type { QueryClient } from "@tanstack/react-query";
import type {
  Order,
  OrderCreateDto,
  OrdersListResponse,
  OrderUpdateDto,
} from "@/entities/order/api/order-types";

export type OrderListSnapshot = readonly [readonly unknown[], OrdersListResponse | undefined];

type OrderPatch = Partial<OrderUpdateDto> & Partial<Order>;

export function isSameOrderId(left: number | string, right: number | string) {
  return String(left) === String(right);
}

export function getOrderListSnapshots(queryClient: QueryClient, listKey: readonly unknown[]) {
  return queryClient.getQueriesData<OrdersListResponse>({
    queryKey: listKey,
    exact: false,
  });
}

export function restoreOrderListSnapshots(queryClient: QueryClient, snapshots: OrderListSnapshot[]) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

export function applyOrderPatch(order: Order, patch: OrderPatch): Order {
  return {
    ...order,
    ...patch,
  };
}

export function patchOrderInLists(
  queryClient: QueryClient,
  listKey: readonly unknown[],
  id: number | string,
  patch: OrderPatch,
) {
  queryClient.setQueriesData<OrdersListResponse>(
    { queryKey: listKey, exact: false },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) =>
          isSameOrderId(item.id, id) ? applyOrderPatch(item, patch) : item,
        ),
      };
    },
  );
}

export function removeOrderFromLists(
  queryClient: QueryClient,
  listKey: readonly unknown[],
  id: number | string,
) {
  queryClient.setQueriesData<OrdersListResponse>(
    { queryKey: listKey, exact: false },
    (old) => {
      if (!old) return old;
      const filtered = old.items.filter((item) => !isSameOrderId(item.id, id));
      return {
        ...old,
        items: filtered,
        total: Math.max(0, old.total - (filtered.length === old.items.length ? 0 : 1)),
      };
    },
  );
}

export function prependOptimisticOrderToLists(
  queryClient: QueryClient,
  listKey: readonly unknown[],
  optimisticOrder: Order,
) {
  queryClient.setQueriesData<OrdersListResponse>(
    { queryKey: listKey, exact: false },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        items: [optimisticOrder, ...old.items],
        total: old.total + 1,
      };
    },
  );
}

export function buildOptimisticOrder(dto: OrderCreateDto, temporaryId: number): Order {
  const nowIso = new Date().toISOString();
  return {
    id: temporaryId,
    clientPhone: dto.clientPhone,
    clientFullName: dto.clientFullName,
    city: dto.city,
    address: dto.address,
    deliveryPrice: dto.deliveryPrice ?? 0,
    paymentStatus: dto.paymentStatus,
    actionStatusCode: dto.actionStatusCode,
    stateStatusCode: dto.stateStatusCode,
    assemblyStatusCode: dto.assemblyStatusCode ?? null,
    storagePlaceId: dto.storagePlaceId ?? null,
    orderStorage: dto.orderStorage,
    description: dto.description,
    productId: dto.productId,
    quantity: dto.quantity,
    productPrice: dto.productPrice ?? null,
    totalPrice: null,
    itemsTotalPrice: null,
    remainingAmount: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
