import type { ActionStatusCode, OrderTableGroup, PaymentStatusCode, StateStatusCode } from "@/shared/config/order-static";
export type Maybe<T> = T | null;

export type OrderListParams = {
  search?: string;
  clientPhone?: string;
  city?: string;
  tableGroup?: OrderTableGroup;
  paymentStatus?: PaymentStatusCode;
  actionStatusCode?: ActionStatusCode;
  actionStatusCodes?: ActionStatusCode[];
  storagePlaceId?: number;
  stateStatusCode?: StateStatusCode;
  dateFrom?: string;
  dateTo?: string;
};

export type OrderStatsSummary = Record<string, number>;

export type Order = {
  id: number;
  clientPhone?: string;
  clientFullName?: string;
  city?: string;
  address?: string;

  deliveryPrice?: Maybe<number>;
  orderStorage?: string;

  paymentStatus?: PaymentStatusCode;
  actionStatusCode?: ActionStatusCode;
  stateStatusCode?: StateStatusCode;
  assemblyStatusCode?: string | null;
  storagePlaceId?: Maybe<number>;
  description?: string;
  prepaymentDate?: Maybe<string>;
  paymentDate?: Maybe<string>;
  assemblyDate?: Maybe<string>;
  totalPrice?: Maybe<number>;
  itemsTotalPrice?: Maybe<number>;
  remainingAmount?: Maybe<number>;

  productId: number;
  quantity: number;
  productPrice?: Maybe<number>;
  productNameSnapshot?: string;
  productStatusNameSnapshot?: string;
  manufacturerNameSnapshot?: string;
  orderSourceNameSnapshot?: string;

  createdAt?: string;
  updatedAt?: string;
};

export type OrderCreateDto = {
  clientPhone: string;
  clientFullName?: string;
  city?: string;
  address?: string;
  deliveryPrice?: Maybe<number>;

  paymentStatus: PaymentStatusCode;
  actionStatusCode: ActionStatusCode;
  stateStatusCode: StateStatusCode;
  assemblyStatusCode?: string | null;
  storagePlaceId?: Maybe<number>;
  orderStorage?: string;

  description?: string;
  productId: number;
  quantity: number;
  productPrice?: Maybe<number>;
};

export type OrderUpdateDto = Partial<OrderCreateDto>;

export type OrderSortBy =
  | "createdAt"
  | "updatedAt"
  | "totalPrice"
  | "remainingAmount"
  | "actionStatusCode"
  | "stateStatusCode"
  | "assemblyStatusCode";
export type OrderSortOrder = "asc" | "desc";

export type OrdersListResponse = {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type OrdersListParams = OrderListParams & {
  page: number;
  pageSize: number;
  sortBy: OrderSortBy;
  sortOrder: OrderSortOrder;
};

