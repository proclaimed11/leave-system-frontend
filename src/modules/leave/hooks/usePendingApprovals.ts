import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";
import { fetchPendingApprovals } from "@/modules/leave/api/leaveApi";

export function usePendingApprovals(
  params?: { page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const authReady = isAuthenticated && !isAuthLoading && Boolean(session?.token);
  const employeeNumber = session?.user.employee_number ?? null;

  return useQuery({
    queryKey: [
      "leave",
      "pending-approvals",
      employeeNumber,
      params?.page ?? 1,
      params?.limit ?? 20,
    ] as const,
    queryFn: () =>
      fetchPendingApprovals({
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      }),
    enabled:
      options?.enabled !== undefined
        ? options.enabled && authReady && Boolean(employeeNumber)
        : authReady && Boolean(employeeNumber),
  });
}
