import type { OrderSortBy, OrderSortOrder } from "@/entities/order/api/order-types";
import type { ActionStatusCode, OrderTableGroup, PaymentStatusCode, StateStatusCode } from "@/shared/config/order-static";

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
  clientPhone?: string;
  tableGroup?: OrderTableGroup;
  city?: string;
  paymentStatus?: PaymentStatusCode;
  actionStatusCode?: ActionStatusCode;
  stateStatusCode?: StateStatusCode;
  storagePlaceId?: number;
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

  const sortBy: OrderSortBy = ([
    "createdAt",
    "updatedAt",
    "totalPrice",
    "remainingAmount",
    "actionStatusCode",
    "stateStatusCode",
    "assemblyStatusCode",
  ] as const).includes(
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
    clientPhone: searchParams.get("clientPhone")?.trim() ? searchParams.get("clientPhone")!.trim() : undefined,
    tableGroup: (searchParams.get("tableGroup") as OrderTableGroup | null) ?? undefined,
    city: searchParams.get("city")?.trim() ? searchParams.get("city")!.trim() : undefined,
    paymentStatus: (searchParams.get("paymentStatus") as PaymentStatusCode | null) ?? undefined,
    actionStatusCode: (searchParams.get("actionStatusCode") as ActionStatusCode | null) ?? undefined,
    stateStatusCode: (searchParams.get("stateStatusCode") as StateStatusCode | null) ?? undefined,
    storagePlaceId: parseIntOrUndefined(searchParams.get("storagePlaceId")),
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

  if (typeof state.drawerOrderId !== "undefined") sp.set("orderId", String(state.drawerOrderId));

  if (state.search) sp.set("search", state.search);
  if (state.clientPhone) sp.set("clientPhone", state.clientPhone);
  if (state.tableGroup) sp.set("tableGroup", state.tableGroup);
  if (state.city) sp.set("city", state.city);
  if (state.paymentStatus) sp.set("paymentStatus", state.paymentStatus);
  if (state.actionStatusCode) sp.set("actionStatusCode", state.actionStatusCode);
  if (state.stateStatusCode) sp.set("stateStatusCode", state.stateStatusCode);
  if (state.storagePlaceId) sp.set("storagePlaceId", String(state.storagePlaceId));
  if (state.dateFrom) sp.set("dateFrom", state.dateFrom);
  if (state.dateTo) sp.set("dateTo", state.dateTo);

  return sp;
}

