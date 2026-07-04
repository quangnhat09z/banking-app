// src/components/AdminRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
  
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  
    return <>{children}</>;
  }