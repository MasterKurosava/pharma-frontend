import {
  Atom,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Pill,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const sidebarRootItems: NavItem[] = [
  { label: "Обзор", to: "/", icon: LayoutDashboard },
  { label: "Препараты", to: "/products", icon: Boxes },
];

export const sidebarNavGroups: NavGroup[] = [
  {
    label: "Заказы",
    icon: ClipboardList,
    items: [
      { label: "Все заказы", to: "/orders", icon: ClipboardList },
      { label: "Заявки", to: "/orders-requests", icon: ClipboardCheck },
      { label: "Самовывоз", to: "/orders-pickup", icon: ClipboardCheck },
      { label: "Доставка Алматы", to: "/orders-almaty-delivery", icon: ClipboardCheck },
      { label: "Доставка РК", to: "/orders-rk-delivery", icon: ClipboardCheck },
      { label: "Архив", to: "/orders-archive", icon: ClipboardCheck },
    ],
  },
  {
    label: "Справочники: препараты",
    icon: Pill,
    items: [
      { label: "Производители", to: "/manufacturers", icon: Factory },
      { label: "Активные вещества", to: "/active-substances", icon: Atom },
      { label: "Источники заказа препаратов", to: "/product-order-sources", icon: Building2 },
      { label: "Места хранения препаратов", to: "/product-storage-places", icon: Warehouse },
    ],
  },
  {
    label: "Справочники: заказы",
    icon: ClipboardCheck,
    items: [
      { label: "Места хранения заказов", to: "/storage-places", icon: Warehouse },
      { label: "Статусы действия", to: "/order-statuses-action", icon: ClipboardCheck },
      { label: "Статусы состояния", to: "/order-statuses-state", icon: ClipboardCheck },
    ],
  },
  {
    label: "Администрирование",
    icon: Users,
    items: [{ label: "Пользователи и роли", to: "/users", icon: Users }],
  },
];
