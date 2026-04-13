import { useQuery } from "@tanstack/react-query";

import { fetchDirectoryRoles } from "../api/directoryApi";

export function useDirectoryRoles() {
  return useQuery({
    queryKey: ["directory", "roles"],
    queryFn: fetchDirectoryRoles,
    staleTime: 5 * 60 * 1000,
  });
}
