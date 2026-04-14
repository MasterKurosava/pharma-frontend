import type { OrderStatusType, OrderTableGroup } from "@/shared/config/order-static";

export type OrderStatusConfigItem = {
  id: number;
  code: string;
  type: OrderStatusType;
  name: string;
  color?: string | null;
  tableGroup?: OrderTableGroup | null;
  reserveOnSet: boolean;
  writeOffOnSet: boolean;
  setAssemblyDateOnSet: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type UpdateOrderStatusConfigDto = {
  name?: string;
  color?: string | null;
  tableGroup?: OrderTableGroup | null;
  reserveOnSet?: boolean;
  writeOffOnSet?: boolean;
  setAssemblyDateOnSet?: boolean;
  sortOrder?: number;
  isActive?: boolean;
};
