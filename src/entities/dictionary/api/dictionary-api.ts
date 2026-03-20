import { apiClient } from "@/shared/api/client";

import type {
  DictionaryCreateDto,
  DictionaryItem,
  DictionaryListParams,
  DictionaryResourceName,
  DictionaryUpdateDto,
} from "@/entities/dictionary/api/dictionary-types";

function dictionaryUrl(resource: DictionaryResourceName) {
  return `/${resource}`;
}

type DictionaryApiItem = {
  id: number;
  name?: string;
  label?: string;
  code?: string;
  isActive?: boolean;
};

function normalizeDictionaryItem(item: DictionaryApiItem): DictionaryItem {
  const displayName = item.name ?? item.label ?? "";
  return {
    id: item.id,
    name: displayName,
    label: item.label ?? item.name ?? "",
    code: item.code,
    isActive: item.isActive,
  };
}

export async function getDictionaryList(
  resource: DictionaryResourceName,
  params?: DictionaryListParams,
): Promise<DictionaryItem[]> {
  const { data } = await apiClient.get<DictionaryApiItem[]>(dictionaryUrl(resource), { params });
  return data.map(normalizeDictionaryItem);
}

export async function getDictionaryById(
  resource: DictionaryResourceName,
  id: number | string,
): Promise<DictionaryItem> {
  const { data } = await apiClient.get<DictionaryApiItem>(`${dictionaryUrl(resource)}/${id}`);
  return normalizeDictionaryItem(data);
}

export async function createDictionaryItem(
  resource: DictionaryResourceName,
  dto: DictionaryCreateDto,
): Promise<DictionaryItem> {
  const { data } = await apiClient.post<DictionaryApiItem>(dictionaryUrl(resource), dto);
  return normalizeDictionaryItem(data);
}

export async function updateDictionaryItem(
  resource: DictionaryResourceName,
  id: number | string,
  dto: DictionaryUpdateDto,
): Promise<DictionaryItem> {
  const { data } = await apiClient.patch<DictionaryApiItem>(`${dictionaryUrl(resource)}/${id}`, dto);
  return normalizeDictionaryItem(data);
}

export async function deleteDictionaryItem(resource: DictionaryResourceName, id: number | string): Promise<void> {
  await apiClient.delete(`${dictionaryUrl(resource)}/${id}`);
}

