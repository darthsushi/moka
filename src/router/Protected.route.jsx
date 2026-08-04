import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';

import RouteLoader from './Loader.route';

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <RouteLoader />;

  if (not(isAuthenticated)) {
    return (
      <Navigate
        to="/auth"
        replace
        state={ { from: location } }
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
