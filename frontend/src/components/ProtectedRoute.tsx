import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role.toLowerCase())) {
    return <Navigate to="/report" replace />;
  }

  return <>{children}</>;
}
