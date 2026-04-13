import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";

import { fetchEmployeesList, type FetchEmployeesListParams } from "../api/directoryApi";
import type { EmployeesListResponse } from "../types";

const baseKey = ["directory", "employees"] as const;

export function useEmployeesList(
  params: FetchEmployeesListParams = {},
  options?: Pick<UseQueryOptions<EmployeesListResponse>, "enabled">
) {
  const { isAuthenticated, isAuthLoading, session } = useAuth();

  const authReady = isAuthenticated && !isAuthLoading && Boolean(session?.token);

  return useQuery({
    queryKey: [...baseKey, params] as const,
    queryFn: () => fetchEmployeesList(params),
    enabled: options?.enabled !== undefined ? options.enabled && authReady : authReady,
    placeholderData: keepPreviousData,
  });
}
