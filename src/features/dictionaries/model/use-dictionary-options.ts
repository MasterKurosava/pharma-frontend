import { useMemo } from "react";

import { useDictionaryListQuery } from "@/features/dictionaries/api/dictionary-crud-hooks";
import type { DictionaryListParams, DictionaryResourceName, DictionaryItem } from "@/entities/dictionary/api/dictionary-types";

export type DictionarySelectOption = {
  value: number;
  label: string;
};

type UseDictionaryOptionsQueryParams = {
  params?: DictionaryListParams;
  includeInactive?: boolean;
  includeCodeInLabel?: boolean;
};

export function useDictionaryOptionsQuery(
  resource: DictionaryResourceName,
  { params, includeCodeInLabel = true }: UseDictionaryOptionsQueryParams = {},
) {
  const queryParams: DictionaryListParams | undefined = params
    ? {
        ...params,
        isActive: undefined,
      }
    : undefined;

  const query = useDictionaryListQuery(resource, queryParams);

  const options = useMemo<DictionarySelectOption[]>(() => {
    const rawItems = query.data ?? [];
    const items =
      typeof params?.isActive === "boolean"
        ? rawItems.filter((item: DictionaryItem) => Boolean(item.isActive) === params.isActive)
        : rawItems;

    return items.map((item: DictionaryItem) => {
      const baseLabel = item.name || item.label;
      const label = includeCodeInLabel && item.code ? `${baseLabel} (${item.code})` : baseLabel;
      return { value: item.id, label };
    });
  }, [includeCodeInLabel, params, query.data]);

  return { ...query, options };
}

