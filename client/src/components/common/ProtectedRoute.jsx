import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, requiredRole, requiredModule }) => {
  const { user, loading, hasModuleAccess } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleSlug = typeof user.role === 'string' ? user.role : user.role?.slug;
  if (requiredRole && roleSlug !== requiredRole && roleSlug !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredModule && !hasModuleAccess(requiredModule)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

