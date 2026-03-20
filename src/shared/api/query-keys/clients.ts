import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

import { serializeQueryParams } from "@/shared/lib/serialize-query-params";

export const clientsQueryKeys = {
  all: ["clients"] as const,
  lists: () => [...clientsQueryKeys.all, "lists"] as const,
  list: (params?: SerializableQueryParams) =>
    [...clientsQueryKeys.lists(), serializeQueryParams(params)] as const,
  detail: (id: number | string) => [...clientsQueryKeys.all, "detail", id] as const,
};

