import { useMemo } from "react";

import { useCitiesQuery } from "@/features/cities/api/city-crud-hooks";
import { useClientsQuery } from "@/features/clients/api/client-crud-hooks";
import { useDictionaryOptionsQuery } from "@/features/dictionaries/model/use-dictionary-options";
import type { DictionarySelectOption } from "@/features/dictionaries/model/use-dictionary-options";
import type { City } from "@/entities/city/api/city-types";
import type { Client } from "@/entities/client/api/client-types";

export function useOrderFilterOptions(countryId?: number) {
  const countries = useDictionaryOptionsQuery("countries", { params: { isActive: true }, includeCodeInLabel: true });
  const allCitiesQuery = useCitiesQuery({
    search: undefined,
  });
  const citiesQuery = useCitiesQuery({
    countryId: countryId ?? undefined,
    isActive: true,
    search: undefined,
  });

  const clientsQuery = useClientsQuery({ search: undefined, clientStatusId: undefined });

  const paymentStatuses = useDictionaryOptionsQuery("payment-statuses", { includeCodeInLabel: false });
  const orderStatuses = useDictionaryOptionsQuery("order-statuses", { includeCodeInLabel: false });
  const assemblyStatuses = useDictionaryOptionsQuery("assembly-statuses", { includeCodeInLabel: false });
  const storagePlaces = useDictionaryOptionsQuery("storage-places", { includeCodeInLabel: false });
  const deliveryCompanies = useDictionaryOptionsQuery("delivery-companies", { includeCodeInLabel: false });

  const cityOptions = useMemo<DictionarySelectOption[]>(() => {
    const items = citiesQuery.data ?? [];
    return items.map((c: City) => ({ value: c.id, label: c.name }));
  }, [citiesQuery.data]);

  const allCityOptions = useMemo<DictionarySelectOption[]>(() => {
    const items = allCitiesQuery.data ?? [];
    return items.map((c: City) => ({ value: c.id, label: c.name }));
  }, [allCitiesQuery.data]);

  const clientOptions = useMemo<DictionarySelectOption[]>(() => {
    const items = clientsQuery.data ?? [];
    return items.map((c: Client) => ({
      value: c.id,
      label: c.phone ? `${c.name} (${c.phone})` : c.name,
    }));
  }, [clientsQuery.data]);

  return {
    countries,
    allCitiesQuery,
    allCityOptions,
    citiesQuery,
    cityOptions,
    clientsQuery,
    clientOptions,
    paymentStatuses,
    orderStatuses,
    assemblyStatuses,
    storagePlaces,
    deliveryCompanies,
  };
}

