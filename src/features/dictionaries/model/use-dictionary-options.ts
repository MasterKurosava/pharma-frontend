import { useMemo } from "react";

import { useDictionaryListQuery } from "@/features/dictionaries/api/dictionary-crud-hooks";
import type { DictionaryListParams, DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";

export type DictionarySelectOption = {
  value: number;
  label: string;
  code?: string;
  color?: string;
};

type UseDictionaryOptionsQueryParams = {
  params?: DictionaryListParams;
  includeCodeInLabel?: boolean;
};

export function useDictionaryOptionsQuery(
  resource: DictionaryResourceName,
  { params, includeCodeInLabel = true }: UseDictionaryOptionsQueryParams = {},
) {
  const query = useDictionaryListQuery(resource, params);

  const options = useMemo<DictionarySelectOption[]>(() => {
    const items = query.data ?? [];

    return items.map((item) => {
      const baseLabel = item.name;
      const label = includeCodeInLabel && item.code ? `${baseLabel} (${item.code})` : baseLabel;
      return { value: item.id, label, code: item.code, color: item.color };
    });
  }, [includeCodeInLabel, query.data]);

  return { ...query, options };
}

