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

  if (requiredRole && user.role?.slug !== requiredRole && user.role?.slug !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredModule && !hasModuleAccess(requiredModule)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

