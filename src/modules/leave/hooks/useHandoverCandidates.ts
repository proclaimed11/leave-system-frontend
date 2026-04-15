import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/AuthContext";
import { fetchHandoverCandidates } from "../api/leaveApi";

export function useHandoverCandidates() {
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const authReady = isAuthenticated && !isAuthLoading && Boolean(session?.token);
  const employeeNumber = session?.user.employee_number ?? null;

  return useQuery({
    queryKey: ["leave", "handover-candidates", employeeNumber] as const,
    queryFn: fetchHandoverCandidates,
    enabled: authReady && Boolean(employeeNumber),
  });
}
