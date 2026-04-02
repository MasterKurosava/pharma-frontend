import type { DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";

export type EditableResource =
  | "orders"
  | "products"
  | "manufacturers"
  | "active-substances"
  | DictionaryResourceName;

const NON_ADMIN_EDITABLE_RESOURCES = new Set<EditableResource>([
  "orders",
]);

const IMMUTABLE_RESOURCES = new Set<EditableResource>();

export function isAdminRole(role: string | null | undefined) {
  const normalized = (role ?? "").trim().toLowerCase();
  return normalized === "admin";
}

export function canEditResource(role: string | null | undefined, resource: EditableResource) {
  if (IMMUTABLE_RESOURCES.has(resource)) return false;
  if (isAdminRole(role)) return true;

  const normalized = (role ?? "").trim().toLowerCase();
  if (normalized === "manager") {
    return true;
  }
  if (normalized === "delivery_operator") {
    return resource === "orders";
  }
  if (normalized === "assembler") {
    return resource === "orders" || resource === "storage-places";
  }
  return NON_ADMIN_EDITABLE_RESOURCES.has(resource);
}

