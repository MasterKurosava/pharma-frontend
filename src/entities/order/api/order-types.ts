export type Maybe<T> = T | null;

export type OrderItem = {
  productId: number;
  quantity: number;
};

export type OrderListParams = {
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

export type OrderStatsSummary = Record<string, number>;

export type OrderHistoryItem = {
  id: number;
  createdAt: string;
  event: string;
  actorUserId?: number;
  meta?: Record<string, unknown>;
};

export type Order = {
  id: number;
  clientId?: number;
  client?: {
    name?: string;
    phone?: string;
  };
  countryId?: number;
  cityId?: number;
  address?: string;

  deliveryCompanyId?: Maybe<number>;
  deliveryTypeId?: Maybe<number>;
  deliveryPrice?: Maybe<number>;

  paymentStatusId?: number;
  orderStatusId?: number;
  assemblyStatusId?: Maybe<number>;
  storagePlaceId?: Maybe<number>;
  responsibleUserId?: Maybe<number>;
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
  clientId: number;
  countryId: number;
  cityId: number;
  address: string;

  deliveryCompanyId?: Maybe<number>;
  deliveryTypeId?: Maybe<number>;
  deliveryPrice?: Maybe<number>;

  paymentStatusId: number;
  orderStatusId: number;
  assemblyStatusId?: Maybe<number>;
  storagePlaceId?: Maybe<number>;
  responsibleUserId?: Maybe<number>;

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

