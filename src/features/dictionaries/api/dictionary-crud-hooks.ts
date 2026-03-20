import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getDictionaryById, getDictionaryList, createDictionaryItem, updateDictionaryItem, deleteDictionaryItem } from "@/entities/dictionary/api/dictionary-api";
import type {
  DictionaryCreateDto,
  DictionaryListParams,
  DictionaryResourceName,
  DictionaryUpdateDto,
} from "@/entities/dictionary/api/dictionary-types";
import { dictionariesQueryKeys } from "@/shared/api/query-keys";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

const DICTIONARY_STALE_TIME_MS = 30 * 60 * 1000;
const DICTIONARY_GC_TIME_MS = 6 * 60 * 60 * 1000;

function toSerializableParams(params: DictionaryListParams | undefined): SerializableQueryParams | undefined {
  if (!params) return undefined;

  return {
    search: params.search,
    isActive: params.isActive,
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dictionariesQueryKeys.listsByResource(resource),
        exact: false,
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, `Failed to create ${resource}`);
      toast.error(message);
    },
  });
}

export function useUpdateDictionaryMutation(resource: DictionaryResourceName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: DictionaryUpdateDto }) =>
      updateDictionaryItem(resource, payload.id, payload.dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dictionariesQueryKeys.listsByResource(resource),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: dictionariesQueryKeys.detail(resource, variables.id),
        exact: true,
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, `Failed to update ${resource}`);
      toast.error(message);
    },
  });
}


export function useDeleteDictionaryMutation(resource: DictionaryResourceName) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteDictionaryItem(resource, id),
    onSuccess: async (_, id) => {
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
    onError: (error) => {
      const message = getApiErrorMessage(error, `Failed to delete ${resource}`);
      toast.error(message);
    },
  });
}
