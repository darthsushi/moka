import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';

import RouteLoader from './Loader.route';

const getRedirectPath = (location) => {
  const from = location.state?.from;

  if (not(from?.pathname)) return '/';

  return `${from.pathname}${from.search || ''}${from.hash || ''}`;
};

function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <RouteLoader />;

  if (isAuthenticated) {
    return <Navigate to={ getRedirectPath(location) } replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
