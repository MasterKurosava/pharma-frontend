import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useMemo } from "react";
import { Toaster } from "sonner";

import { QUERY_CACHE_PERSIST_MAX_AGE_MS, queryClient } from "@/app/providers/query-client";
import { AppRouter } from "@/app/router/router";
import { AuthProvider } from "@/features/auth/model/auth-provider";

export function AppProviders() {
  const persister = useMemo(
    () =>
      createSyncStoragePersister({
        storage: window.localStorage,
        key: "pharma-admin-react-query-cache-v1",
      }),
    [],
  );

  const persistOptions = useMemo(
    () => ({
      persister,
      maxAge: QUERY_CACHE_PERSIST_MAX_AGE_MS,
      buster: "v1",
    }),
    [persister],
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <AuthProvider>
        <AppRouter />
        <Toaster richColors position="top-right" closeButton duration={2000} />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
