import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";
import { fetchApplyLeaveOverview } from "../api/leaveApi";

export function useApplyLeaveOverview() {
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const authReady = isAuthenticated && !isAuthLoading && Boolean(session?.token);
  const employeeNumber = session?.user.employee_number ?? null;

  return useQuery({
    queryKey: ["leave", "apply-overview", employeeNumber] as const,
    queryFn: fetchApplyLeaveOverview,
    enabled: authReady && Boolean(employeeNumber),
  });
}
