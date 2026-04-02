import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/model/use-auth";
import { LoadingScreen } from "@/shared/ui/loading-screen";

type GuardedRouteProps = {
  requireAuth?: boolean;
};

export function GuardedRoute({ requireAuth = true }: GuardedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <LoadingScreen />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireAuth && isAuthenticated && user) {
    const allowedRoutes = user.accessPolicy?.navigation.allowedRoutes ?? ["*"];
    const hasWildcard = allowedRoutes.includes("*");
    const path = location.pathname || "/";
    const isAllowed = hasWildcard || allowedRoutes.includes(path);
    if (!isAllowed) {
      const fallback = allowedRoutes.find((route) => route !== "*") ?? "/";
      return <Navigate to={fallback} replace />;
    }
  }

  return <Outlet />;
}
