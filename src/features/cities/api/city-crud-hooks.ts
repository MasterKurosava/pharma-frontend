import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getCities, getCityById, createCity, updateCity, deleteCity } from "@/entities/city/api/city-api";
import type { CityListParams, CreateCityDto, UpdateCityDto } from "@/entities/city/api/city-types";
import { citiesQueryKeys } from "@/shared/api/query-keys/cities";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import type { SerializableQueryParams } from "@/shared/lib/serialize-query-params";

const CITY_STALE_TIME_MS = 5 * 60 * 1000;
const CITY_GC_TIME_MS = 60 * 60 * 1000;

function toSerializableParams(params: CityListParams | undefined): SerializableQueryParams | undefined {
  if (!params) return undefined;
  return {
    search: params.search,
    countryId: params.countryId,
    isActive: params.isActive,
  };
}

export function useCitiesQuery(params?: CityListParams) {
  return useQuery({
    queryKey: citiesQueryKeys.list(toSerializableParams(params)),
    queryFn: () => getCities(params),
    retry: false,
    staleTime: CITY_STALE_TIME_MS,
    gcTime: CITY_GC_TIME_MS,
  });
}

export function useCityDetailQuery(id: number | string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: typeof id === "undefined" ? citiesQueryKeys.detail(0) : citiesQueryKeys.detail(id),
    queryFn: () => getCityById(id ?? ""),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}

export function useCreateCityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCityDto) => createCity(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.lists(), exact: false });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create city"));
    },
  });
}

export function useUpdateCityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number | string; dto: UpdateCityDto }) => updateCity(payload.id, payload.dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.lists(), exact: false });
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.detail(variables.id), exact: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update city"));
    },
  });
}


export function useDeleteCityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteCity(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: citiesQueryKeys.lists(), exact: false }),
        queryClient.invalidateQueries({ queryKey: citiesQueryKeys.detail(id), exact: true }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete city"));
    },
  });
}
