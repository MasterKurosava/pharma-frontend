import { useQuery } from "@tanstack/react-query";
import { getAssemblyStatuses } from "@/entities/assembly-status/api/assembly-status-api";

export function useAssemblyStatusesQuery() {
  return useQuery({
    queryKey: ["assembly-statuses"],
    queryFn: getAssemblyStatuses,
    staleTime: 60_000,
  });
}
