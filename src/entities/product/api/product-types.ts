import type { ProductAvailabilityStatus } from "@/shared/config/product-availability";

export type Product = {
  id: number;
  name: string;
  manufacturerId: number;
  activeSubstanceId: number;
  availabilityStatus: ProductAvailabilityStatus;
  availabilityStatusLabel?: string;
  productOrderSourceId?: number | null;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
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
  isActive?: boolean;
};

export type CreateProductDto = {
  name: string;
  manufacturerId: number;
  activeSubstanceId: number;
  availabilityStatus: ProductAvailabilityStatus;
  productOrderSourceId?: number;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  imageUrl?: string | null;
  description?: string | null;
};

export type UpdateProductDto = {
  name?: string;
  manufacturerId?: number;
  activeSubstanceId?: number;
  availabilityStatus?: ProductAvailabilityStatus;
  productOrderSourceId?: number;
  isActive?: boolean;
  stockQuantity?: number;
  reservedQuantity?: number;
  imageUrl?: string | null;
  description?: string | null;
};

