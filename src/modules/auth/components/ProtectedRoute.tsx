import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Restoring session...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
