import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getDictionaryById, getDictionaryList, createDictionaryItem, updateDictionaryItem, deleteDictionaryItem } from "@/entities/dictionary/api/dictionary-api";
import type {
  DictionaryCreateDto,
  DictionaryItem,
  DictionaryListParams,
  DictionaryResourceName,
  DictionaryUpdateDto,
} from "@/entities/dictionary/api/dictionary-types";
import { dictionariesQueryKeys } from "@/shared/api/query-keys";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

const DICTIONARY_STALE_TIME_MS = 30 * 60 * 1000;
const DICTIONARY_GC_TIME_MS = 6 * 60 * 60 * 1000;

type DictionaryOptimisticContext = {
  listSnapshots: Array<readonly [readonly unknown[], DictionaryItem[] | undefined]>;
  detailSnapshot?: DictionaryItem;
  id?: number | string;
  temporaryId?: number;
};

function toSerializableParams(params: DictionaryListParams | undefined): SerializableQueryParams | undefined {
  if (!params) return undefined;

  return {
    search: params.search,
    isActive: params.isActive,
  };
}

function isSameId(left: number | string, right: number | string) {
  return String(left) === String(right);
}

function getDictionaryListSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  resource: DictionaryResourceName,
) {
  return queryClient.getQueriesData<DictionaryItem[]>({
    queryKey: dictionariesQueryKeys.listsByResource(resource),
    exact: false,
  });
}

function restoreDictionaryListSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: Array<readonly [readonly unknown[], DictionaryItem[] | undefined]>,
) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

function upsertDictionaryItem(
  list: DictionaryItem[] | undefined,
  item: DictionaryItem,
  temporaryId?: number,
): DictionaryItem[] {
  const current = list ?? [];
  if (typeof temporaryId === "number") {
    let replaced = false;
    const mapped = current.map((existing) => {
      if (!isSameId(existing.id, temporaryId)) return existing;
      replaced = true;
      return item;
    });
    if (replaced) return mapped;
  }

  const exists = current.some((existing) => isSameId(existing.id, item.id));
  return exists ? current : [item, ...current];
}

function applyDictionaryPatch(item: DictionaryItem, dto: DictionaryUpdateDto): DictionaryItem {
  return {
    ...item,
    ...dto,
    name: dto.name ?? item.name,
    label: dto.name ?? item.label,
  };
}

export function useDictionaryListQuery(resource: DictionaryResourceName, params?: DictionaryListParams) {
  return useQuery({
    queryKey: dictionariesQueryKeys.list(resource, toSerializableParams(params)),
    queryFn: () => getDictionaryList(resource, params),
    retry: false,
    staleTime: DICTIONARY_STALE_TIME_MS,
    gcTime: DICTIONARY_GC_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useDictionaryDetailQuery(resource: DictionaryResourceName, id: number | string | undefined) {
  return useQuery({
    queryKey: dictionariesQueryKeys.detail(resource, id ?? ""),
    queryFn: () => getDictionaryById(resource, id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCreateDictionaryMutation(resource: DictionaryResourceName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: DictionaryCreateDto) => createDictionaryItem(resource, dto),
    onMutate: async (dto): Promise<DictionaryOptimisticContext> => {
      await queryClient.cancelQueries({
        queryKey: dictionariesQueryKeys.listsByResource(resource),
        exact: false,
      });

      const listSnapshots = getDictionaryListSnapshots(queryClient, resource);
      const temporaryId = -Date.now();
      const optimisticItem: DictionaryItem = {
        id: temporaryId,
        name: dto.name,
        label: dto.name,
        code: dto.code,
        color: dto.color,
        isActive: dto.isActive,
      };

      queryClient.setQueriesData<DictionaryItem[]>(
        { queryKey: dictionariesQueryKeys.listsByResource(resource), exact: false },
        (old) => [optimisticItem, ...(old ?? [])],
      );

      return { listSnapshots, temporaryId };
    },
    onSuccess: (createdItem, _variables, context) => {
      queryClient.setQueryData(dictionariesQueryKeys.detail(resource, createdItem.id), createdItem);
      queryClient.setQueriesData<DictionaryItem[]>(
        { queryKey: dictionariesQueryKeys.listsByResource(resource), exact: false },
        (old) => upsertDictionaryItem(old, createdItem, context?.temporaryId),
      );
    },
    onError: (error, _variables, context) => {
      restoreDictionaryListSnapshots(queryClient, context?.listSnapshots ?? []);
      const message = getApiErrorMessage(error, `Failed to create ${resource}`);
      toast.error(message);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: dictionariesQueryKeys.listsByResource(resource),
        exact: false,
      });
    },
  });
}

export function useUpdateDictionaryMutation(resource: DictionaryResourceName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: DictionaryUpdateDto }) =>
      updateDictionaryItem(resource, payload.id, payload.dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({
        queryKey: dictionariesQueryKeys.listsByResource(resource),
        exact: false,
      });
      await queryClient.cancelQueries({
        queryKey: dictionariesQueryKeys.detail(resource, id),
        exact: true,
      });

      const listSnapshots = getDictionaryListSnapshots(queryClient, resource);
      const detailSnapshot = queryClient.getQueryData<DictionaryItem>(dictionariesQueryKeys.detail(resource, id));

      queryClient.setQueriesData<DictionaryItem[]>(
        { queryKey: dictionariesQueryKeys.listsByResource(resource), exact: false },
        (old) => old?.map((item) => (isSameId(item.id, id) ? applyDictionaryPatch(item, dto) : item)) ?? old,
      );

      if (detailSnapshot) {
        queryClient.setQueryData<DictionaryItem>(
          dictionariesQueryKeys.detail(resource, id),
          applyDictionaryPatch(detailSnapshot, dto),
        );
      }

      return { listSnapshots, detailSnapshot, id };
    },
    onSuccess: (updatedItem, variables) => {
      queryClient.setQueryData(dictionariesQueryKeys.detail(resource, variables.id), updatedItem);
      queryClient.setQueryData(dictionariesQueryKeys.detail(resource, updatedItem.id), updatedItem);
      queryClient.setQueriesData<DictionaryItem[]>(
        { queryKey: dictionariesQueryKeys.listsByResource(resource), exact: false },
        (old) => old?.map((item) => (isSameId(item.id, updatedItem.id) ? { ...item, ...updatedItem } : item)) ?? old,
      );
    },
    onError: (error, _variables, context) => {
      restoreDictionaryListSnapshots(queryClient, context?.listSnapshots ?? []);
      if (context?.id && context.detailSnapshot) {
        queryClient.setQueryData(dictionariesQueryKeys.detail(resource, context.id), context.detailSnapshot);
      }
      const message = getApiErrorMessage(error, `Failed to update ${resource}`);
      toast.error(message);
    },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dictionariesQueryKeys.listsByResource(resource),
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: dictionariesQueryKeys.detail(resource, variables.id),
          exact: true,
        }),
      ]);
    },
  });
}


export function useDeleteDictionaryMutation(resource: DictionaryResourceName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteDictionaryItem(resource, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: dictionariesQueryKeys.listsByResource(resource),
        exact: false,
      });
      await queryClient.cancelQueries({
        queryKey: dictionariesQueryKeys.detail(resource, id),
        exact: true,
      });

      const listSnapshots = getDictionaryListSnapshots(queryClient, resource);
      const detailSnapshot = queryClient.getQueryData<DictionaryItem>(dictionariesQueryKeys.detail(resource, id));

      queryClient.setQueriesData<DictionaryItem[]>(
        { queryKey: dictionariesQueryKeys.listsByResource(resource), exact: false },
        (old) => old?.filter((item) => !isSameId(item.id, id)) ?? old,
      );
      queryClient.removeQueries({ queryKey: dictionariesQueryKeys.detail(resource, id), exact: true });

      return { listSnapshots, detailSnapshot, id };
    },
    onError: (error, _id, context) => {
      restoreDictionaryListSnapshots(queryClient, context?.listSnapshots ?? []);
      if (context?.id && context.detailSnapshot) {
        queryClient.setQueryData(dictionariesQueryKeys.detail(resource, context.id), context.detailSnapshot);
      }
      const message = getApiErrorMessage(error, `Failed to delete ${resource}`);
      toast.error(message);
    },
    onSettled: async (_data, _error, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dictionariesQueryKeys.listsByResource(resource),
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: dictionariesQueryKeys.detail(resource, id),
          exact: true,
        }),
      ]);
    },
  });
}
