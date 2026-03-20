import type { OrderSortBy, OrderSortOrder } from "@/entities/order/api/order-types";

export const ordersUrlDefaults = {
  page: 1,
  pageSize: 20,
  sortBy: "createdAt" as OrderSortBy,
  sortOrder: "desc" as OrderSortOrder,
} as const;

export type OrdersDrawerState = {
  drawerOrderId?: number;
};

export type OrdersFiltersState = {
  search?: string;
  clientId?: number;
  countryId?: number;
  cityId?: number;
  responsibleUserId?: number;
  paymentStatusId?: number;
  orderStatusId?: number;
  assemblyStatusId?: number;
  storagePlaceId?: number;
  deliveryCompanyId?: number;
  dateFrom?: string;
  dateTo?: string;
};

export type OrdersListUrlState = OrdersFiltersState &
  OrdersDrawerState & {
    page: number;
    pageSize: number;
    sortBy: OrderSortBy;
    sortOrder: OrderSortOrder;
  };

function parseIntOrUndefined(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

function parseDate(value: string | null): string | undefined {
  if (!value) return undefined;
  // Accept ISO-like dates: YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}

export function parseOrdersSearchParams(searchParams: URLSearchParams): OrdersListUrlState {
  const page = parseIntOrUndefined(searchParams.get("page")) ?? ordersUrlDefaults.page;
  const pageSize = parseIntOrUndefined(searchParams.get("pageSize")) ?? ordersUrlDefaults.pageSize;

  const sortByRaw = searchParams.get("sortBy") ?? ordersUrlDefaults.sortBy;
  const sortOrderRaw = searchParams.get("sortOrder") ?? ordersUrlDefaults.sortOrder;

  const sortBy: OrderSortBy = (["createdAt", "updatedAt", "totalPrice", "remainingAmount"] as const).includes(
    sortByRaw as OrderSortBy,
  )
    ? (sortByRaw as OrderSortBy)
    : ordersUrlDefaults.sortBy;

  const sortOrder: OrderSortOrder = (["asc", "desc"] as const).includes(sortOrderRaw as OrderSortOrder)
    ? (sortOrderRaw as OrderSortOrder)
    : ordersUrlDefaults.sortOrder;

  return {
    drawerOrderId: parseIntOrUndefined(searchParams.get("orderId")),
    search: searchParams.get("search")?.trim() ? searchParams.get("search")!.trim() : undefined,
    clientId: parseIntOrUndefined(searchParams.get("clientId")),
    countryId: parseIntOrUndefined(searchParams.get("countryId")),
    cityId: parseIntOrUndefined(searchParams.get("cityId")),
    responsibleUserId: parseIntOrUndefined(searchParams.get("responsibleUserId")),
    paymentStatusId: parseIntOrUndefined(searchParams.get("paymentStatusId")),
    orderStatusId: parseIntOrUndefined(searchParams.get("orderStatusId")),
    assemblyStatusId: parseIntOrUndefined(searchParams.get("assemblyStatusId")),
    storagePlaceId: parseIntOrUndefined(searchParams.get("storagePlaceId")),
    deliveryCompanyId: parseIntOrUndefined(searchParams.get("deliveryCompanyId")),
    dateFrom: parseDate(searchParams.get("dateFrom")),
    dateTo: parseDate(searchParams.get("dateTo")),
    page: page >= 1 ? page : ordersUrlDefaults.page,
    pageSize: pageSize >= 1 ? pageSize : ordersUrlDefaults.pageSize,
    sortBy,
    sortOrder,
  };
}

export function serializeOrdersSearchParams(state: OrdersListUrlState): URLSearchParams {
  const sp = new URLSearchParams();

  sp.set("page", String(state.page));
  sp.set("pageSize", String(state.pageSize));
  sp.set("sortBy", state.sortBy);
  sp.set("sortOrder", state.sortOrder);

  if (state.drawerOrderId) sp.set("orderId", String(state.drawerOrderId));

  if (state.search) sp.set("search", state.search);
  if (state.clientId) sp.set("clientId", String(state.clientId));
  if (state.countryId) sp.set("countryId", String(state.countryId));
  if (state.cityId) sp.set("cityId", String(state.cityId));
  if (state.responsibleUserId) sp.set("responsibleUserId", String(state.responsibleUserId));
  if (state.paymentStatusId) sp.set("paymentStatusId", String(state.paymentStatusId));
  if (state.orderStatusId) sp.set("orderStatusId", String(state.orderStatusId));
  if (state.assemblyStatusId) sp.set("assemblyStatusId", String(state.assemblyStatusId));
  if (state.storagePlaceId) sp.set("storagePlaceId", String(state.storagePlaceId));
  if (state.deliveryCompanyId) sp.set("deliveryCompanyId", String(state.deliveryCompanyId));
  if (state.dateFrom) sp.set("dateFrom", state.dateFrom);
  if (state.dateTo) sp.set("dateTo", state.dateTo);

  return sp;
}

