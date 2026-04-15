import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";
import { fetchApprovalHistory } from "@/modules/leave/api/leaveApi";

type ApprovalHistoryParams = {
  page?: number;
  limit?: number;
  action?: "APPROVED" | "REJECTED" | "PENDING";
  search?: string;
};

export function useApprovalHistory(params?: ApprovalHistoryParams) {
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const authReady = isAuthenticated && !isAuthLoading && Boolean(session?.token);
  const employeeNumber = session?.user.employee_number ?? null;

  return useQuery({
    queryKey: ["leave", "approval-history", employeeNumber, params] as const,
    queryFn: () => fetchApprovalHistory(params),
    enabled: authReady && Boolean(employeeNumber),
  });
}
