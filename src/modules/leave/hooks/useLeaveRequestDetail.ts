import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";
import { fetchLeaveRequestDetail } from "@/modules/leave/api/leaveApi";

export function useLeaveRequestDetail(requestId?: number) {
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const authReady = isAuthenticated && !isAuthLoading && Boolean(session?.token);
  const employeeNumber = session?.user.employee_number ?? null;
  const validRequest = typeof requestId === "number" && Number.isFinite(requestId);

  return useQuery({
    queryKey: ["leave", "request-detail", employeeNumber, requestId] as const,
    queryFn: () => fetchLeaveRequestDetail(requestId as number),
    enabled: authReady && Boolean(employeeNumber) && validRequest,
  });
}
