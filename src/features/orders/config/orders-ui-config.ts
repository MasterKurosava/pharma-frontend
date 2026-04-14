import type { OrderTableGroup } from "@/shared/config/order-static";
import { ORDER_TABLE_GROUP_TABS } from "@/shared/config/order-static";

export const ORDER_DEFAULT_CODES = {
  actionStatusCode: "ACTION_IN_STOCK",
  stateStatusCode: "STATE_OFFER_ANALOGS",
} as const;

export const ORDER_TEXTS = {
  emptyTitle: "Заказы не найдены",
  emptyDescription: "Попробуйте изменить фильтры или строку поиска.",
  createButton: "Создать заказ",
  searchPlaceholder: "Поиск по заказу, городу, адресу...",
} as const;

export const ORDER_TABLE_TABS: Array<{ value: OrderTableGroup | "ALL"; label: string }> = ORDER_TABLE_GROUP_TABS;

export const ORDER_FILTERS_CONFIG = [
  { key: "search", label: "Поиск" },
  { key: "tableGroup", label: "Группа" },
  { key: "city", label: "Город" },
  { key: "paymentStatus", label: "Статус оплаты" },
  { key: "orderStatus", label: "Статус действия" },
  { key: "orderStatuses", label: "Статус состояния" },
] as const;
