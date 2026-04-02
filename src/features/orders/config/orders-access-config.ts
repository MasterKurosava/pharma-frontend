import type { OrdersFiltersState, OrdersListUrlState } from "@/features/orders/model/orders-url";
import type { OrderFilterKey } from "@/entities/user/model/types";
import type { DeliveryStatusCode, OrderStatusCode } from "@/shared/config/order-static";

export const ORDER_DEFAULT_VISIBLE_FILTERS: OrderFilterKey[] = [
  "search",
  "countryId",
  "city",
  "paymentStatus",
  "orderStatus",
  "deliveryStatus",
];

export const ORDER_ADDITIONAL_ACTIVE_COUNT_KEYS: Array<keyof OrdersFiltersState> = [
  "deliveryStatus",
];

export const ORDER_FILTER_PATCH_RESET_PAGE_KEYS: Array<keyof OrdersFiltersState> = [
  "search",
  "countryId",
  "city",
  "paymentStatus",
  "orderStatus",
  "deliveryStatus",
];

export const ORDER_EMPTY_FILTERS_STATE: OrdersFiltersState = {
  search: undefined,
  countryId: undefined,
  city: undefined,
  paymentStatus: undefined,
  orderStatus: undefined,
  deliveryStatus: undefined,
};

export function applyFixedOrderFilters(
  state: OrdersListUrlState,
  fixed: { countryId?: number; city?: string; orderStatus?: string; deliveryStatuses?: string[] },
): OrdersListUrlState {
  const nextDeliveryStatus =
    fixed.deliveryStatuses && fixed.deliveryStatuses.length > 0
      ? (state.deliveryStatus && fixed.deliveryStatuses.includes(state.deliveryStatus)
          ? state.deliveryStatus
          : fixed.deliveryStatuses[0])
      : state.deliveryStatus;

  return {
    ...state,
    ...(fixed.countryId !== undefined ? { countryId: fixed.countryId } : {}),
    ...(fixed.city !== undefined ? { city: fixed.city } : {}),
    ...(fixed.orderStatus !== undefined ? { orderStatus: fixed.orderStatus as OrderStatusCode } : {}),
    ...(nextDeliveryStatus !== undefined ? { deliveryStatus: nextDeliveryStatus as DeliveryStatusCode } : {}),
  };
}

