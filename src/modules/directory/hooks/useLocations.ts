import { useQuery } from "@tanstack/react-query";

import { fetchLocations } from "../api/directoryApi";

type UseLocationsOptions = {
  enabled?: boolean;
};

export function useLocations(options: UseLocationsOptions = {}) {
  return useQuery({
    queryKey: ["directory", "locations"],
    queryFn: fetchLocations,
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
}
