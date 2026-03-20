import { apiClient } from "@/shared/api/client";

import type { City, CityListParams, CreateCityDto, UpdateCityDto } from "@/entities/city/api/city-types";

export async function getCities(params?: CityListParams): Promise<City[]> {
  const { data } = await apiClient.get<City[]>("/cities", { params });
  return data;
}

export async function getCityById(id: number | string): Promise<City> {
  const { data } = await apiClient.get<City>(`/cities/${id}`);
  return data;
}

export async function createCity(dto: CreateCityDto): Promise<City> {
  const { data } = await apiClient.post<City>("/cities", dto);
  return data;
}

export async function updateCity(id: number | string, dto: UpdateCityDto): Promise<City> {
  const { data } = await apiClient.patch<City>(`/cities/${id}`, dto);
  return data;
}

export async function deleteCity(id: number | string): Promise<void> {
  await apiClient.delete(`/cities/${id}`);
}
