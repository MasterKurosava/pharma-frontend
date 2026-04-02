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
      { label: "Доставка", to: "/orders-delivery", icon: ClipboardCheck },
      { label: "Сборка", to: "/orders-assembly", icon: ClipboardCheck },
    ],
  },
  {
    label: "Справочники: препараты",
    icon: Pill,
    items: [
      { label: "Производители", to: "/manufacturers", icon: Factory },
      { label: "Активные вещества", to: "/active-substances", icon: Atom },
      { label: "Источники заказа препаратов", to: "/product-order-sources", icon: Building2 },
    ],
  },
  {
    label: "Справочники: заказы",
    icon: ClipboardCheck,
    items: [
      { label: "Места хранения", to: "/storage-places", icon: Warehouse },
    ],
  },
  {
    label: "Администрирование",
    icon: Users,
    items: [{ label: "Пользователи и роли", to: "/users", icon: Users }],
  },
];
