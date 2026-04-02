export type DictionaryResourceName =
  | "manufacturers"
  | "active-substances"
  | "product-order-sources"
  | "storage-places"
  | "countries";

export type DictionaryItem = {
  id: number;
  name: string;
  // Keep label for backward compatibility in existing UI components.
  label: string;
  code?: string;
  color?: string;
  isActive?: boolean;
};

export type DictionaryListParams = {
  search?: string;
  isActive?: boolean;
};

export type DictionaryCreateDto = {
  name: string;
  code?: string;
  color?: string;
  isActive?: boolean;
};

export type DictionaryUpdateDto = {
  name?: string;
  code?: string;
  color?: string;
  isActive?: boolean;
};

