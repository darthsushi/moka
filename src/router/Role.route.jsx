import { Navigate, Outlet } from 'react-router-dom';

import { not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';

import RouteLoader from './Loader.route';

function RoleRoute({ allowedRoles = [] }) {
  const { hasAnyRole, loading } = useAuth();

  if (loading) return <RouteLoader />;

  if (not(hasAnyRole(allowedRoles))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
