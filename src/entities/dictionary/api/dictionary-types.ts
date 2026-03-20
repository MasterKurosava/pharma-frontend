export type DictionaryResourceName =
  | "client-statuses"
  | "manufacturers"
  | "active-substances"
  | "product-statuses"
  | "product-order-sources"
  | "delivery-companies"
  | "delivery-types"
  | "payment-statuses"
  | "assembly-statuses"
  | "order-statuses"
  | "storage-places"
  | "countries";

export type DictionaryItem = {
  id: number;
  name: string;
  // Keep label for backward compatibility in existing UI components.
  label: string;
  code?: string;
  isActive?: boolean;
};

export type DictionaryListParams = {
  search?: string;
  isActive?: boolean;
};

export type DictionaryCreateDto = {
  name: string;
  code?: string;
  isActive?: boolean;
};

export type DictionaryUpdateDto = {
  name?: string;
  code?: string;
  isActive?: boolean;
};

