import { getMe, login } from "@/entities/auth/api/auth-api";

import type { LoginDto, LoginResponse, MeResponse } from "@/features/auth/api/types";

// Backward-compatible exports for existing auth flow.
export async function loginRequest(payload: LoginDto): Promise<LoginResponse> {
  return login(payload);
}

export async function getCurrentUserRequest(): Promise<MeResponse> {
  return getMe();
}
