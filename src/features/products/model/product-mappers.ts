import type { Product, CreateProductDto, UpdateProductDto } from "@/entities/product/api/product-types";
import type { ProductFormValues } from "@/features/products/model/product-form-schema";
import type { ProductAvailabilityStatus } from "@/shared/config/product-availability";

function parseProductPrice(value: Product["price"]): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function productApiToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    price: parseProductPrice(product.price),
    manufacturerId: product.manufacturerId,
    activeSubstanceId: product.activeSubstanceId,
    availabilityStatus: (product.availabilityStatus ?? "IN_STOCK") as ProductAvailabilityStatus,
    productOrderSourceId: product.productOrderSourceId ?? 0,
    stockQuantity: product.stockQuantity,
    reservedQuantity: product.reservedQuantity,
    imageUrl: product.imageUrl ?? "",
    description: product.description ?? "",
    isActive: product.isActive,
  };
}

export function productFormValuesToCreateDto(values: ProductFormValues): CreateProductDto {
  return {
    name: values.name,
    price: values.price,
    manufacturerId: values.manufacturerId,
    activeSubstanceId: values.activeSubstanceId,
    availabilityStatus: values.availabilityStatus,
    productOrderSourceId: values.productOrderSourceId > 0 ? values.productOrderSourceId : undefined,
    isActive: values.isActive,
    stockQuantity: values.stockQuantity,
    reservedQuantity: values.reservedQuantity,
    imageUrl: values.imageUrl.trim().length === 0 ? undefined : values.imageUrl,
    description: values.description.trim().length === 0 ? undefined : values.description,
  };
}

export function productFormValuesToUpdateDto(values: ProductFormValues): UpdateProductDto {
  return {
    name: values.name,
    price: values.price,
    manufacturerId: values.manufacturerId,
    activeSubstanceId: values.activeSubstanceId,
    availabilityStatus: values.availabilityStatus,
    productOrderSourceId: values.productOrderSourceId > 0 ? values.productOrderSourceId : undefined,
    isActive: values.isActive,
    stockQuantity: values.stockQuantity,
    reservedQuantity: values.reservedQuantity,
    imageUrl: values.imageUrl.trim().length === 0 ? undefined : values.imageUrl,
    description: values.description.trim().length === 0 ? undefined : values.description,
  };
}

