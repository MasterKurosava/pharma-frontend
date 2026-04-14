export type PaymentStatusCode = "UNPAID" | "PREPAID_50" | "PAID";
export type OrderStatusType = "ACTION" | "STATE";
export type OrderTableGroup = "REQUESTS" | "PICKUP" | "ALMATY_DELIVERY" | "RK_DELIVERY" | "ARCHIVE";

export type ActionStatusCode =
  | "ACTION_IN_STOCK"
  | "ACTION_OUT_OF_STOCK"
  | "ACTION_MOSCOW"
  | "ACTION_TURKEY"
  | "ACTION_TC"
  | "ACTION_WAREHOUSE"
  | "ACTION_INDIA"
  | "ACTION_PLACE_ORDER"
  | "ACTION_ORDER_MOSCOW"
  | "ACTION_ORDER_TC"
  | "ACTION_ORDER_TURKEY"
  | "ACTION_ORDER_INDIA"
  | "ACTION_ORDER_WAREHOUSE"
  | "ACTION_COLLECT_PICKUP"
  | "ACTION_SELECT_YANDEX"
  | "ACTION_CALLED_YANDEX"
  | "ACTION_COLLECT_ALMATY"
  | "ACTION_COLLECT_PONY"
  | "ACTION_COLLECT_DOVAS"
  | "ACTION_COLLECT_INDRIVER"
  | "ACTION_RECEIVED_REPLY"
  | "ACTION_NOTIFY_OTHER";

export type StateStatusCode =
  | "STATE_OFFER_ANALOGS"
  | "STATE_WRITTEN_WO"
  | "STATE_WRITTEN_WNG"
  | "STATE_REACHED_PHONE"
  | "STATE_NOT_REACHED_PHONE"
  | "STATE_PROCESSING_STARTED"
  | "STATE_ORDERED"
  | "STATE_CC"
  | "STATE_CCV"
  | "STATE_CLOSED_PLUS"
  | "STATE_CLOSED_MINUS";

export const ORDER_TABLE_GROUP_LABELS: Record<OrderTableGroup, string> = {
  REQUESTS: "Заявки",
  PICKUP: "Самовывоз",
  ALMATY_DELIVERY: "Доставка Алматы",
  RK_DELIVERY: "Доставка РК",
  ARCHIVE: "Архив",
};

export const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatusCode; label: string; color: string }> = [
  { value: "UNPAID", label: "Не оплачен", color: "#dc2626" },
  { value: "PREPAID_50", label: "Предоплата 50%", color: "#f59e0b" },
  { value: "PAID", label: "Оплачен", color: "#16a34a" },
];

export const ORDER_TABLE_GROUP_TABS: Array<{ value: OrderTableGroup | "ALL"; label: string }> = [
  { value: "ALL", label: "Все заказы" },
  { value: "REQUESTS", label: "Заявки" },
  { value: "PICKUP", label: "Самовывоз" },
  { value: "ALMATY_DELIVERY", label: "Доставка Алматы" },
  { value: "RK_DELIVERY", label: "Доставка РК" },
  { value: "ARCHIVE", label: "Архив" },
];
