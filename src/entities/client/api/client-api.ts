import { apiClient } from "@/shared/api/client";

import type {
  Client,
  ClientListParams,
  CreateClientDto,
  UpdateClientDto,
} from "@/entities/client/api/client-types";

export async function getClients(params?: ClientListParams): Promise<Client[]> {
  const { data } = await apiClient.get<Client[]>("/clients", { params });
  return data;
}

export async function getClientById(id: number | string): Promise<Client> {
  const { data } = await apiClient.get<Client>(`/clients/${id}`);
  return data;
}

export async function createClient(dto: CreateClientDto): Promise<Client> {
  const { data } = await apiClient.post<Client>("/clients", dto);
  return data;
}

export async function updateClient(id: number | string, dto: UpdateClientDto): Promise<Client> {
  const { data } = await apiClient.patch<Client>(`/clients/${id}`, dto);
  return data;
}

export async function deleteClient(id: number | string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}

