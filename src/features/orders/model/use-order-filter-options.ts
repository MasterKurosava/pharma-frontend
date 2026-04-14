import { useMemo } from "react";

import { useDictionaryOptionsQuery } from "@/features/dictionaries/model/use-dictionary-options";
import { PAYMENT_STATUS_OPTIONS } from "@/shared/config/order-static";
import { useOrderStatusConfigsQuery } from "@/features/orders/api/order-status-queries";
import { useAssemblyStatusesQuery } from "@/features/orders/api/assembly-status-queries";

type StatusOption = { value: string; label: string; color?: string };

export function useOrderFilterOptions() {
  const actionStatusesQuery = useOrderStatusConfigsQuery("ACTION");
  const stateStatusesQuery = useOrderStatusConfigsQuery("STATE");
  const assemblyStatusesQuery = useAssemblyStatusesQuery();

  const paymentStatuses = useMemo<StatusOption[]>(
    () => PAYMENT_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label, color: item.color })),
    [],
  );
  const actionStatuses = useMemo<StatusOption[]>(
    () =>
      (actionStatusesQuery.data ?? []).map((item) => ({
        value: item.code,
        label: item.name,
        color: item.color ?? undefined,
      })),
    [actionStatusesQuery.data],
  );
  const stateStatuses = useMemo<StatusOption[]>(
    () =>
      (stateStatusesQuery.data ?? []).map((item) => ({
        value: item.code,
        label: item.name,
        color: item.color ?? undefined,
      })),
    [stateStatusesQuery.data],
  );
  const assemblyStatuses = useMemo<StatusOption[]>(
    () =>
      (assemblyStatusesQuery.data ?? []).map((item) => ({
        value: item.code,
        label: item.name,
        color: item.color ?? undefined,
      })),
    [assemblyStatusesQuery.data],
  );
  const storagePlaces = useDictionaryOptionsQuery("storage-places", { includeCodeInLabel: false });

  return {
    paymentStatuses,
    actionStatuses,
    stateStatuses,
    assemblyStatuses,
    storagePlaces,
    isStatusesLoading:
      actionStatusesQuery.isLoading || stateStatusesQuery.isLoading || assemblyStatusesQuery.isLoading,
  };
}

