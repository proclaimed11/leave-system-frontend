import { useQuery } from "@tanstack/react-query";

import { fetchCountries } from "../api/directoryApi";

export function useCountries() {
  return useQuery({
    queryKey: ["directory", "countries"],
    queryFn: fetchCountries,
    staleTime: 5 * 60 * 1000,
  });
}
