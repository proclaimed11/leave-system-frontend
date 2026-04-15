import { useQuery } from "@tanstack/react-query";
import { fetchCountryOverview } from "../api/directoryApi";

export function useCountryOverview(countryPrefix: string, enabled = true) {
  const key = (countryPrefix || "").trim().toUpperCase();
  return useQuery({
    queryKey: ["directory", "dashboard", "country-overview", key],
    queryFn: () => fetchCountryOverview(key),
    enabled: enabled && Boolean(key),
  });
}
