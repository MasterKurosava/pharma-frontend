import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/model/use-auth";
import { LoadingScreen } from "@/shared/ui/loading-screen";

type GuardedRouteProps = {
  requireAuth?: boolean;
};

export function GuardedRoute({ requireAuth = true }: GuardedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingScreen />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
