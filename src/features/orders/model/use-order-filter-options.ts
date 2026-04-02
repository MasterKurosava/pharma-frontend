import { useMemo } from "react";

import { useDictionaryOptionsQuery } from "@/features/dictionaries/model/use-dictionary-options";
import { DELIVERY_STATUS_OPTIONS, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/shared/config/order-static";

type StatusOption = { value: string; label: string; color?: string };

export function useOrderFilterOptions(_countryId?: number) {
  const countries = useDictionaryOptionsQuery("countries", { params: { isActive: true }, includeCodeInLabel: true });

  const paymentStatuses = useMemo<StatusOption[]>(
    () => PAYMENT_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label, color: item.color })),
    [],
  );
  const orderStatuses = useMemo<StatusOption[]>(
    () => ORDER_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label, color: item.color })),
    [],
  );
  const deliveryStatuses = useMemo<StatusOption[]>(
    () => DELIVERY_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label, color: item.color })),
    [],
  );
  const storagePlaces = useDictionaryOptionsQuery("storage-places", { includeCodeInLabel: false });

  return {
    countries,
    paymentStatuses,
    orderStatuses,
    deliveryStatuses,
    storagePlaces,
  };
}

