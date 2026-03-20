import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getClientById, getClients, createClient, updateClient, deleteClient } from "@/entities/client/api/client-api";
import type { ClientListParams, CreateClientDto, UpdateClientDto } from "@/entities/client/api/client-types";
import { clientsQueryKeys } from "@/shared/api/query-keys/clients";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";
import { parseConflictErrorForField } from "@/shared/lib/parse-conflict-field-error";

function toSerializableParams(params: ClientListParams | undefined): SerializableQueryParams | undefined {
  if (!params) return undefined;
  return {
    search: params.search,
    clientStatusId: params.clientStatusId,
  };
}

export function useClientsQuery(params?: ClientListParams) {
  return useQuery({
    queryKey: clientsQueryKeys.list(toSerializableParams(params)),
    queryFn: () => getClients(params),
    retry: false,
  });
}

export function useClientDetailQuery(id: number | string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: typeof id === "undefined" ? clientsQueryKeys.detail(0) : clientsQueryKeys.detail(id),
    queryFn: () => getClientById(id ?? ""),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateClientDto) => createClient(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.lists(), exact: false });
    },
    onError: (error) => {
      const phoneConflict = parseConflictErrorForField(error, "phone");
      if (phoneConflict) return; // The modal will show the field error.

      toast.error(getApiErrorMessage(error, "Failed to create client"));
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: UpdateClientDto }) => updateClient(payload.id, payload.dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.lists(), exact: false });
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.detail(variables.id), exact: true });
    },
    onError: (error) => {
      const phoneConflict = parseConflictErrorForField(error, "phone");
      if (phoneConflict) return; // The modal will show the field error.

      toast.error(getApiErrorMessage(error, "Failed to update client"));
    },
  });
}


export function useDeleteClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteClient(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.lists(), exact: false }),
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.detail(id), exact: true }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete client"));
    },
  });
}
