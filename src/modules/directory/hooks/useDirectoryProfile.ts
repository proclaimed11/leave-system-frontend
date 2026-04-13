import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";

import { fetchMyProfile } from "../api/directoryApi";

const QUERY_KEY = ["directory", "profile"] as const;

/**
 * Current user's directory employee profile (GET directory-svc /profile).
 * Waits until auth bootstrap finishes so the Bearer token is set.
 */
export function useDirectoryProfile() {
  const { isAuthenticated, isAuthLoading, session } = useAuth();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMyProfile,
    enabled:
      isAuthenticated &&
      !isAuthLoading &&
      Boolean(session?.token),
  });
}
