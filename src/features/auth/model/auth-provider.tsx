import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCurrentUserRequest, loginRequest } from "@/features/auth/api/auth-api";
import type { LoginDto } from "@/features/auth/api/types";
import { AuthContext, type AuthContextValue } from "@/features/auth/model/auth-context";
import { authQueryKeys } from "@/features/auth/model/auth-query-keys";
import { subscribeUnauthorizedEvent } from "@/features/auth/model/auth-events";
import { useCurrentUserQuery } from "@/features/auth/model/use-current-user-query";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/shared/lib/auth-token";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  const hasToken = Boolean(token);

  const currentUserQuery = useCurrentUserQuery({
    enabled: hasToken,
  });

  const dropSession = useCallback(() => {
    clearAccessToken();
    setToken(null);
    queryClient.removeQueries({ queryKey: authQueryKeys.currentUser });
  }, [queryClient]);

  useEffect(() => {
    if (!hasToken) {
      queryClient.removeQueries({ queryKey: authQueryKeys.currentUser });
    }
  }, [hasToken, queryClient]);

  useEffect(() => {
    const unsubscribe = subscribeUnauthorizedEvent(() => {
      dropSession();
    });

    return unsubscribe;
  }, [dropSession]);

  const login = useCallback(
    async (payload: LoginDto) => {
      const { accessToken } = await loginRequest(payload);
      setAccessToken(accessToken);
      setToken(accessToken);

      const currentUser = await queryClient.fetchQuery({
        queryKey: authQueryKeys.currentUser,
        queryFn: getCurrentUserRequest,
      });

      return currentUser;
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    dropSession();
  }, [dropSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUserQuery.data ?? null,
      isAuthenticated: hasToken && Boolean(currentUserQuery.data),
      isBootstrapping: hasToken && currentUserQuery.isPending,
      login,
      logout,
    }),
    [currentUserQuery.data, currentUserQuery.isPending, hasToken, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
