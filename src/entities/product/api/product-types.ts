import type { ProductAvailabilityStatus } from "@/shared/config/product-availability";

export type ProductStoragePlaceInfo = {
  id: number;
  name: string;
  description?: string | null;
};

export type Product = {
  id: number;
  name: string;
  manufacturerId: number;
  activeSubstanceId: number;
  availabilityStatus: ProductAvailabilityStatus;
  availabilityStatusLabel?: string;
  productOrderSourceId?: number | null;
  productStoragePlaceId?: number | null;
  productStoragePlace?: ProductStoragePlaceInfo | null;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  price?: number | string | null;
  imageUrl?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductListParams = {
  search?: string;
  manufacturerId?: number;
  activeSubstanceId?: number;
  availabilityStatus?: ProductAvailabilityStatus;
  productOrderSourceId?: number;
  productStoragePlaceId?: number;
  isActive?: boolean;
};

export type CreateProductDto = {
  name: string;
  price: number;
  manufacturerId: number;
  activeSubstanceId: number;
  availabilityStatus: ProductAvailabilityStatus;
  productOrderSourceId?: number;
  productStoragePlaceId?: number;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  imageUrl?: string | null;
  description?: string | null;
};

export type UpdateProductDto = {
  name?: string;
  price?: number;
  manufacturerId?: number;
  activeSubstanceId?: number;
  availabilityStatus?: ProductAvailabilityStatus;
  productOrderSourceId?: number;
  productStoragePlaceId?: number | null;
  isActive?: boolean;
  stockQuantity?: number;
  reservedQuantity?: number;
  imageUrl?: string | null;
  description?: string | null;
};
