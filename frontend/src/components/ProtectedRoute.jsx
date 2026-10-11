import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center">
          <p className="font-semibold text-ink mb-2">Access denied</p>
          <p className="text-muted text-sm">You need to be logged in as {roles.join(" or ")} to view this page.</p>
        </div>
      </div>
    );
  }
  return children;
}
