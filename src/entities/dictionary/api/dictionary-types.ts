export type DictionaryResourceName =
  | "manufacturers"
  | "active-substances"
  | "product-order-sources"
  | "storage-places"
  | "product-storage-places";

export type DictionaryItem = {
  id: number;
  name: string;
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

