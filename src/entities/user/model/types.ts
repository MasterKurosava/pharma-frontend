export type UserRole = "admin" | "manager" | "viewer" | string;

export type OrderFilterKey =
  | "search"
  | "clientPhone"
  | "countryId"
  | "city"
  | "paymentStatus"
  | "orderStatus"
  | "orderStatuses"
  | "storagePlaceId"
  | "deliveryStatus"
  | "dateFrom"
  | "dateTo";

export type OrderUpdateFieldKey =
  | "clientPhone"
  | "countryId"
  | "city"
  | "address"
  | "deliveryStatus"
  | "deliveryPrice"
  | "paymentStatus"
  | "orderStatus"
  | "storagePlaceId"
  | "description"
  | "paidAmount"
  | "items";

export type AccessPolicy = {
  role: string;
  navigation: {
    allowedRoutes: string[];
  };
  orders: {
    fixedFilters: {
      countryId?: number;
      city?: string;
      orderStatus?: string;
      deliveryStatuses?: string[];
    };
    visibleFilters: OrderFilterKey[];
    editableFields: OrderUpdateFieldKey[];
  };
};

export type CurrentUser = {
  userId: number;
  login: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  accessPolicy?: AccessPolicy;
};
