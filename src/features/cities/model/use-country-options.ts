import { useMemo } from "react";

import { useDictionaryListQuery } from "@/features/dictionaries/api/dictionary-crud-hooks";
import type { DictionaryItem } from "@/entities/dictionary/api/dictionary-types";

export type CountryOption = {
  value: number;
  label: string;
};

export function useCountryOptionsQuery() {
  const countriesQuery = useDictionaryListQuery("countries", undefined);

  const options = useMemo<CountryOption[]>(() => {
    const items = (countriesQuery.data ?? []) as DictionaryItem[];

    return items.map((c) => ({
      value: c.id,
      label: c.code ? `${c.name || c.label} (${c.code})` : c.name || c.label,
    }));
  }, [countriesQuery.data]);

  return {
    ...countriesQuery,
    options,
  };
}

