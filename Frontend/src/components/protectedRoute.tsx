import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/context/authContext";
import { BookOpen } from "lucide-react";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BookOpen className="h-8 w-8 animate-pulse text-muted-foreground" />
        <p className='text-2xl text-red-700 shadow-2xs backdrop-blur-2xl'>404</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
