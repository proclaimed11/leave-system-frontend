import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";

import { fetchEmployeeByNumber } from "../api/directoryApi";

export function useEmployeeDetail(employeeNumber: string | undefined) {
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const authReady = isAuthenticated && !isAuthLoading && Boolean(session?.token);

  return useQuery({
    queryKey: ["directory", "employee", employeeNumber] as const,
    queryFn: () => fetchEmployeeByNumber(employeeNumber!),
    enabled: authReady && Boolean(employeeNumber),
  });
}
