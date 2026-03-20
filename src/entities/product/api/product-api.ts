import { apiClient } from "@/shared/api/client";

import type { CreateProductDto, Product, ProductListParams, UpdateProductDto } from "@/entities/product/api/product-types";

export async function getProducts(params?: ProductListParams): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/products", { params });
  return data;
}

export async function getProductById(id: number | string): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  const { data } = await apiClient.post<Product>("/products", dto);
  return data;
}

export async function updateProduct(id: number | string, dto: UpdateProductDto): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/products/${id}`, dto);
  return data;
}

export async function deleteProduct(id: number | string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

