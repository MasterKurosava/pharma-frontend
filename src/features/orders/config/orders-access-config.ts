import type { OrdersFiltersState, OrdersListUrlState } from "@/features/orders/model/orders-url";
import type { OrderFilterKey } from "@/entities/user/model/types";
import type { ActionStatusCode, OrderTableGroup } from "@/shared/config/order-static";

export const ORDER_DEFAULT_VISIBLE_FILTERS: OrderFilterKey[] = [
  "search",
  "tableGroup",
  "city",
  "paymentStatus",
  "orderStatus",
  "stateStatuses",
  "assemblyStatuses",
];

export const ORDER_ADDITIONAL_ACTIVE_COUNT_KEYS: Array<keyof OrdersFiltersState> = [
  "tableGroup",
  "stateStatusCodes",
  "assemblyStatusCodes",
];

export const ORDER_FILTER_PATCH_RESET_PAGE_KEYS: Array<keyof OrdersFiltersState> = [
  "search",
  "tableGroup",
  "city",
  "paymentStatus",
  "actionStatusCode",
  "stateStatusCodes",
  "assemblyStatusCodes",
];

export const ORDER_EMPTY_FILTERS_STATE: OrdersFiltersState = {
  search: undefined,
  tableGroup: undefined,
  city: undefined,
  paymentStatus: undefined,
  actionStatusCode: undefined,
  stateStatusCodes: undefined,
  assemblyStatusCodes: undefined,
};

export function applyFixedOrderFilters(
  state: OrdersListUrlState,
  fixed: { city?: string; orderStatus?: string; tableGroup?: string },
): OrdersListUrlState {
  return {
    ...state,
    ...(fixed.city !== undefined ? { city: fixed.city } : {}),
    ...(fixed.orderStatus !== undefined ? { actionStatusCode: fixed.orderStatus as ActionStatusCode } : {}),
    ...(fixed.tableGroup !== undefined ? { tableGroup: fixed.tableGroup as OrderTableGroup } : {}),
  };
}

