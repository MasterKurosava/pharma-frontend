import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { getCurrentUserRequest } from "@/features/auth/api/auth-api";
import type { MeResponse } from "@/features/auth/api/types";
import { authQueryKeys } from "@/features/auth/model/auth-query-keys";

type UseCurrentUserQueryOptions = {
  enabled?: boolean;
} & Omit<UseQueryOptions<MeResponse, Error, MeResponse, typeof authQueryKeys.currentUser>, "queryKey" | "queryFn">;

export function useCurrentUserQuery({ enabled = true, ...options }: UseCurrentUserQueryOptions = {}) {
  return useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUserRequest,
    enabled,
    retry: false,
    ...options,
  });
}
