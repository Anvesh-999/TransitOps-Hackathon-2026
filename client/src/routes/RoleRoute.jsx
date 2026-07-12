import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRoute = ({ children, permissions = [], roles = [] }) => {
  const { user, can, hasRole } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const hasPermission = permissions.length === 0 || permissions.some((p) => can(p));
  const hasRequiredRole = roles.length === 0 || hasRole(...roles);

  if (!hasPermission && !hasRequiredRole) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">403</h1>
          <p className="text-gray-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleRoute;
