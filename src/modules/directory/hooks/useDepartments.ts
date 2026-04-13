import { useQuery } from "@tanstack/react-query";

import { fetchDepartments, type FetchDepartmentsParams } from "../api/directoryApi";

export function useDepartments(params: FetchDepartmentsParams = {}) {
  const { company_key } = params;
  return useQuery({
    queryKey: ["directory", "departments", company_key ?? "all"] as const,
    queryFn: () => fetchDepartments(params),
    staleTime: 5 * 60 * 1000,
  });
}
