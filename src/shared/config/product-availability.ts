export type ProductAvailabilityStatus = "OUT_OF_STOCK" | "ON_REQUEST" | "IN_STOCK";

export const PRODUCT_AVAILABILITY_OPTIONS: Array<{
  value: ProductAvailabilityStatus;
  label: string;
  color: string;
}> = [
  { value: "OUT_OF_STOCK", label: "Нет в наличии", color: "#dc2626" },
  { value: "ON_REQUEST", label: "На заказ", color: "#f59e0b" },
  { value: "IN_STOCK", label: "Есть", color: "#16a34a" },
];
