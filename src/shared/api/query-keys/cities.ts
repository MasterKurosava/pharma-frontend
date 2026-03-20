import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

import { serializeQueryParams } from "@/shared/lib/serialize-query-params";

export const citiesQueryKeys = {
  all: ["cities"] as const,
  lists: () => [...citiesQueryKeys.all, "lists"] as const,
  list: (params?: SerializableQueryParams) => [...citiesQueryKeys.lists(), serializeQueryParams(params)] as const,
  detail: (id: number | string) => [...citiesQueryKeys.all, "detail", id] as const,
};

