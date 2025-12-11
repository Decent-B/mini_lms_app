import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RootRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'staff') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
}
