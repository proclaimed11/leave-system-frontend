import { useQuery } from "@tanstack/react-query";

import { fetchLocations } from "../api/directoryApi";

export function useLocations() {
  return useQuery({
    queryKey: ["directory", "locations"],
    queryFn: fetchLocations,
    staleTime: 5 * 60 * 1000,
  });
}
