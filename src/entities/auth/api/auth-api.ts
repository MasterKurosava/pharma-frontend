import { apiClient } from "@/shared/api/client";

import type { LoginDto, LoginResponse, MeResponse } from "@/entities/auth/api/types";

export async function login(dto: LoginDto): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", dto);
  return data;
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
}

