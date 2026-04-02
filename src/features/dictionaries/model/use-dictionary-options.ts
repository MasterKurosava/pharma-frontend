import { useMemo } from "react";

import { useDictionaryListQuery } from "@/features/dictionaries/api/dictionary-crud-hooks";
import type { DictionaryListParams, DictionaryResourceName, DictionaryItem } from "@/entities/dictionary/api/dictionary-types";

export type DictionarySelectOption = {
  value: number;
  label: string;
  code?: string;
  color?: string;
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
  const query = useDictionaryListQuery(resource, params);

  const options = useMemo<DictionarySelectOption[]>(() => {
    const items = (query.data ?? []) as DictionaryItem[];

    return items.map((item: DictionaryItem) => {
      const baseLabel = item.name || item.label;
      const label = includeCodeInLabel && item.code ? `${baseLabel} (${item.code})` : baseLabel;
      return { value: item.id, label, code: item.code, color: item.color };
    });
  }, [includeCodeInLabel, params, query.data]);

  return { ...query, options };
}

