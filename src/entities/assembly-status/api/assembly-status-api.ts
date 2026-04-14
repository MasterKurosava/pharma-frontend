import { apiClient } from "@/shared/api/client";
import type { AssemblyStatusItem } from "./assembly-status-types";

export async function getAssemblyStatuses(): Promise<AssemblyStatusItem[]> {
  const { data } = await apiClient.get<AssemblyStatusItem[]>("/assembly-statuses");
  return data;
}
