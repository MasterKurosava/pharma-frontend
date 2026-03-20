import type { Product, CreateProductDto, UpdateProductDto } from "@/entities/product/api/product-types";
import type { ProductFormValues } from "@/features/products/model/product-form-schema";

export function productApiToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    manufacturerId: product.manufacturerId,
    activeSubstanceId: product.activeSubstanceId,
    productStatusId: product.productStatusId,
    productOrderSourceId: product.productOrderSourceId,
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
    manufacturerId: values.manufacturerId,
    activeSubstanceId: values.activeSubstanceId,
    productStatusId: values.productStatusId,
    productOrderSourceId: values.productOrderSourceId,
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
    manufacturerId: values.manufacturerId,
    activeSubstanceId: values.activeSubstanceId,
    productStatusId: values.productStatusId,
    productOrderSourceId: values.productOrderSourceId,
    isActive: values.isActive,
    stockQuantity: values.stockQuantity,
    reservedQuantity: values.reservedQuantity,
    imageUrl: values.imageUrl.trim().length === 0 ? undefined : values.imageUrl,
    description: values.description.trim().length === 0 ? undefined : values.description,
  };
}

