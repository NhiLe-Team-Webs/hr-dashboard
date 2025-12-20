import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingPage } from './ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status, session, userRole } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (status === 'loading') {
    return <LoadingPage />;
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait for role to be fetched
  if (session && userRole === null) {
    return <LoadingPage />;
  }

  // Check if user has allowed role
  const ALLOWED_ROLES = ['manager', 'admin', 'owner'];
  if (userRole && !ALLOWED_ROLES.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
