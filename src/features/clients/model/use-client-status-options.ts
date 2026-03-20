import { useMemo } from "react";

import { useDictionaryListQuery } from "@/features/dictionaries/api/dictionary-crud-hooks";
import type { DictionaryItem } from "@/entities/dictionary/api/dictionary-types";

export type ClientStatusOption = {
  value: number;
  label: string;
};

export function useClientStatusOptionsQuery() {
  const dictQuery = useDictionaryListQuery("client-statuses", { search: undefined, isActive: undefined });

  const options = useMemo<ClientStatusOption[]>(() => {
    const items = (dictQuery.data ?? []) as DictionaryItem[];
    return items.map((item) => ({
      value: item.id,
      label: item.name || item.label,
    }));
  }, [dictQuery.data]);

  return { ...dictQuery, options };
}

