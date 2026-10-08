import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/context/authContext";
import { BookOpen } from "lucide-react";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BookOpen className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;