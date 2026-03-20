import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

import { serializeQueryParams } from "@/shared/lib/serialize-query-params";

export const ordersQueryKeys = {
  all: ["orders"] as const,
  stats: {
    summary: () => [...ordersQueryKeys.all, "stats", "summary"] as const,
  },
  lists: () => [...ordersQueryKeys.all, "lists"] as const,
  list: (params?: SerializableQueryParams) =>
    [...ordersQueryKeys.lists(), serializeQueryParams(params)] as const,
  detail: (id: number | string) => [...ordersQueryKeys.all, "detail", id] as const,
  history: (id: number | string) => [...ordersQueryKeys.all, "history", id] as const,
};

