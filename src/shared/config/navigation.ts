import {
  Atom,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FlaskConical,
  Factory,
  HandCoins,
  Globe,
  LayoutDashboard,
  PackageCheck,
  Pill,
  MapPin,
  Users,
  Truck,
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
  { label: "Заказы", to: "/orders", icon: ClipboardList },
  { label: "Препараты", to: "/products", icon: Boxes },
  { label: "Клиенты", to: "/clients", icon: Users },
];

export const sidebarNavGroups: NavGroup[] = [
  {
    label: "География",
    icon: Globe,
    items: [
      { label: "Города", to: "/cities", icon: MapPin },
      { label: "Страны", to: "/countries", icon: Globe },
    ],
  },
  {
    label: "Справочники: препараты",
    icon: Pill,
    items: [
      { label: "Производители", to: "/manufacturers", icon: Factory },
      { label: "Активные вещества", to: "/active-substances", icon: Atom },
      { label: "Статусы препаратов", to: "/product-statuses", icon: PackageCheck },
      { label: "Источники заказа препаратов", to: "/product-order-sources", icon: Building2 },
    ],
  },
  {
    label: "Справочники: заказы",
    icon: ClipboardCheck,
    items: [
      { label: "Статусы оплаты", to: "/payment-statuses", icon: HandCoins },
      { label: "Статусы сборки", to: "/assembly-statuses", icon: FlaskConical },
      { label: "Статусы заказа", to: "/order-statuses", icon: ClipboardCheck },
      { label: "Службы доставки", to: "/delivery-companies", icon: Truck },
      { label: "Типы доставки", to: "/delivery-types", icon: Truck },
      { label: "Места хранения", to: "/storage-places", icon: Warehouse },
    ],
  },
  {
    label: "Справочники: клиенты",
    icon: Users,
    items: [{ label: "Статусы клиентов", to: "/client-statuses", icon: Users }],
  },
];
