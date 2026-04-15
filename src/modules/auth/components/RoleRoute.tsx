import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useDirectoryProfile } from "@/modules/directory/hooks/useDirectoryProfile";

type RoleRouteProps = {
  children: ReactElement;
  allowRoles: string[];
};

/**
 * Route-level UI guard.
 * Uses directory role + system-admin override to block direct URL access.
 */
export function RoleRoute({ children, allowRoles }: RoleRouteProps) {
  const { isAuthLoading, session } = useAuth();
  const profileQuery = useDirectoryProfile();

  if (isAuthLoading || profileQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Checking permissions...</p>;
  }

  if (session?.user.is_system_admin) {
    return children;
  }

  const role = String(profileQuery.data?.directory_role ?? "").toLowerCase().trim();
  const allowed = allowRoles.map((r) => r.toLowerCase());

  if (!allowed.includes(role)) {
    return <Navigate to="/my-leave" replace />;
  }

  return children;
}
