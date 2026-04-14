import {
  ORDER_TABLE_GROUP_LABELS,
  type OrderTableGroup,
} from "@/shared/config/order-static";

export const ROLE_ROUTE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "/", label: "Обзор" },
  { value: "/orders", label: "Все заказы" },
  { value: "/orders-requests", label: "Заказы: заявки" },
  { value: "/orders-pickup", label: "Заказы: самовывоз" },
  { value: "/orders-almaty-delivery", label: "Заказы: доставка Алматы" },
  { value: "/orders-rk-delivery", label: "Заказы: доставка РК" },
  { value: "/orders-archive", label: "Заказы: архив" },
  { value: "/products", label: "Препараты" },
  { value: "/manufacturers", label: "Производители" },
  { value: "/active-substances", label: "Активные вещества" },
  { value: "/product-order-sources", label: "Источники заказа препаратов" },
  { value: "/storage-places", label: "Места хранения" },
  { value: "/order-statuses-action", label: "Статусы действия" },
  { value: "/order-statuses-state", label: "Статусы состояния" },
  { value: "/users", label: "Пользователи и роли" },
];

export const ROLE_ORDER_TABLE_GROUP_OPTIONS: Array<{
  value: OrderTableGroup;
  label: string;
}> = Object.entries(ORDER_TABLE_GROUP_LABELS).map(([value, label]) => ({
  value: value as OrderTableGroup,
  label,
}));
