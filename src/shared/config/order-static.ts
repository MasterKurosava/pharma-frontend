export type OrderStatusCode =
  | "ORDER"
  | "DELIVERY_REGISTRATION"
  | "ADDRESS_REQUIRED"
  | "ASSEMBLY_REQUIRED"
  | "ASSEMBLED_WRITTEN_OFF"
  | "PACKED"
  | "CLOSED";

export type DeliveryStatusCode = "COLLECT_DOVAS" | "COLLECT_PONY" | "COLLECT_YANDEX";
export type PaymentStatusCode = "UNPAID" | "PREPAID_50" | "PAID";

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatusCode; label: string; color: string }> = [
  { value: "ORDER", label: "Заказ препарата", color: "#2563eb" },
  { value: "DELIVERY_REGISTRATION", label: "Оформление доставки", color: "#7c3aed" },
  { value: "ADDRESS_REQUIRED", label: "Требуется адрес", color: "#ea580c" },
  { value: "ASSEMBLY_REQUIRED", label: "Требует сборки", color: "#d97706" },
  { value: "ASSEMBLED_WRITTEN_OFF", label: "Собрали, Списали", color: "#0891b2" },
  { value: "PACKED", label: "Упакован", color: "#0d9488" },
  { value: "CLOSED", label: "Закрыт", color: "#16a34a" },
];

export const DELIVERY_STATUS_OPTIONS: Array<{ value: DeliveryStatusCode; label: string; color: string }> = [
  { value: "COLLECT_DOVAS", label: "Соберите ДоВас", color: "#2563eb" },
  { value: "COLLECT_PONY", label: "Соберите Пони", color: "#7c3aed" },
  { value: "COLLECT_YANDEX", label: "Соберите Яндекс", color: "#f59e0b" },
];

export const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatusCode; label: string; color: string }> = [
  { value: "UNPAID", label: "Не оплачен", color: "#dc2626" },
  { value: "PREPAID_50", label: "Предоплата 50%", color: "#f59e0b" },
  { value: "PAID", label: "Оплачен", color: "#16a34a" },
];

export const DEFAULT_GEO_CONFIG = {
  countryCode: "KZ",
  countryName: "Казахстан",
  cities: ["Алматы", "Астана"],
} as const;
