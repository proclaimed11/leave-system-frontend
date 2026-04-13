import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

type ProtectedRouteProps = {
  children: ReactElement;
  /** Route is only for users who must set a new password (e.g. /change-password). */
  allowPasswordChangeOnly?: boolean;
};

export function ProtectedRoute({
  children,
  allowPasswordChangeOnly = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const location = useLocation();
  const mustChange = Boolean(session?.user.must_change_password);

  if (isAuthLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Restoring session...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowPasswordChangeOnly) {
    if (!mustChange) {
      return <Navigate to="/" replace />;
    }
  } else if (mustChange && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}
