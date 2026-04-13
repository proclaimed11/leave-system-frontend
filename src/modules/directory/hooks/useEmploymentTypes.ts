import { useQuery } from "@tanstack/react-query";

import { fetchEmploymentTypes } from "../api/directoryApi";

export function useEmploymentTypes() {
  return useQuery({
    queryKey: ["directory", "employment-types"],
    queryFn: fetchEmploymentTypes,
    staleTime: 5 * 60 * 1000,
  });
}
