import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";
import {
  fetchMyLeaveRequests,
  type FetchMyLeaveRequestsParams,
} from "@/modules/leave/api/leaveApi";

export function useMyLeaveRequests(params: FetchMyLeaveRequestsParams = {}) {
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const authReady = isAuthenticated && !isAuthLoading && Boolean(session?.token);
  const employeeNumber = session?.user.employee_number ?? null;

  return useQuery({
    queryKey: ["leave", "my-requests", employeeNumber, params] as const,
    queryFn: () => fetchMyLeaveRequests(params),
    enabled: authReady && Boolean(employeeNumber),
  });
}
