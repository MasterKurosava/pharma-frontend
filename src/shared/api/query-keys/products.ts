import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

import { serializeQueryParams } from "@/shared/lib/serialize-query-params";

export const productsQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productsQueryKeys.all, "lists"] as const,
  list: (params?: SerializableQueryParams) => [...productsQueryKeys.lists(), serializeQueryParams(params)] as const,
  detail: (id: number | string) => [...productsQueryKeys.all, "detail", id] as const,
};

