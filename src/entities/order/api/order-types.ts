import type { DeliveryStatusCode, OrderStatusCode, PaymentStatusCode } from "@/shared/config/order-static";
export type Maybe<T> = T | null;

export type OrderItem = {
  id?: number;
  productId: number;
  quantity: number;
  productNameSnapshot?: string;
};

export type OrderListParams = {
  search?: string;
  clientPhone?: string;
  countryId?: number;
  city?: string;
  paymentStatus?: PaymentStatusCode;
  orderStatus?: OrderStatusCode;
  orderStatuses?: OrderStatusCode[];
  storagePlaceId?: number;
  deliveryStatus?: DeliveryStatusCode;
  dateFrom?: string;
  dateTo?: string;
};

export type OrderStatsSummary = Record<string, number>;

export type Order = {
  id: number;
  clientPhone?: string;
  countryId?: number;
  city?: string;
  address?: string;

  deliveryStatus?: DeliveryStatusCode;
  deliveryPrice?: Maybe<number>;

  paymentStatus?: PaymentStatusCode;
  orderStatus?: OrderStatusCode;
  storagePlaceId?: Maybe<number>;
  description?: string;
  paidAmount?: Maybe<number>;
  totalPrice?: Maybe<number>;
  remainingAmount?: Maybe<number>;

  items: OrderItem[];

  createdAt?: string;
  updatedAt?: string;
  itemsCount?: number;
};

export type OrderCreateDto = {
  clientPhone: string;
  countryId: number;
  city: string;
  address: string;

  deliveryStatus: DeliveryStatusCode;
  deliveryPrice?: Maybe<number>;

  paymentStatus: PaymentStatusCode;
  orderStatus: OrderStatusCode;
  storagePlaceId?: Maybe<number>;

  description?: string;
  paidAmount?: Maybe<number>;

  items: OrderItem[];
};

export type OrderUpdateDto = Partial<OrderCreateDto>;

export type OrderSortBy = "createdAt" | "updatedAt" | "totalPrice" | "remainingAmount";
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

