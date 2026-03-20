import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

import type { DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";
import { serializeQueryParams } from "@/shared/lib/serialize-query-params";

export const dictionariesQueryKeys = {
  all: ["dictionaries"] as const,
  lists: () => [...dictionariesQueryKeys.all, "lists"] as const,
  listsByResource: (resource: DictionaryResourceName) =>
    [...dictionariesQueryKeys.lists(), resource] as const,
  list: (resource: DictionaryResourceName, params?: SerializableQueryParams) =>
    [...dictionariesQueryKeys.listsByResource(resource), serializeQueryParams(params)] as const,
  detail: (resource: DictionaryResourceName, id: number | string) =>
    [...dictionariesQueryKeys.all, "detail", resource, id] as const,
};

