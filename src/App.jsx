import { Toast } from '@heroui/react';
import { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { MODULES } from '@/settings/navigation.settings';

import { AppLayout } from '@/components/layouts';
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from '@/router';
import { AccessDenied, Auth, HomePage, Inventory, NotFound, PlacementPage, Settings } from '@/components/views';
import PlacementDetailsDialog from '@/components/views/home/elements/PlacementDetailsDialog';

import './App.css';

function App() {
  const location = useLocation();
  const [initialEntryKey] = useState(() => location.key);
  // React Router persists location.state in browser history. On a hard reload
  // the current entry becomes the initial entry, so render the full page.
  const backgroundLocation = location.key !== initialEntryKey
    ? location.state?.backgroundLocation
    : null;

  return (
    <>
      <Routes location={ backgroundLocation ?? location }>
        <Route element={ <AppLayout /> }>
          <Route index element={ <HomePage /> } />
          <Route path="home" element={ <Navigate to="/" replace /> } />
          <Route path="p/:code" element={ <PlacementPage /> } />
          <Route path="p/:id/:shareToken" element={ <PlacementPage /> } />
          <Route path={ MODULES.SETTINGS.id } element={ <Settings /> } />
          <Route path="forbidden" element={ <AccessDenied /> } />

          <Route element={ <ProtectedRoute /> }>
            <Route element={
              <RoleRoute allowedRoles={ MODULES.INVENTORY.roles } />
            }>
              <Route
                path={ MODULES.INVENTORY.id }
                element={ <Inventory /> }
              />
            </Route>
          </Route>

          <Route
            path="*"
            element={ <NotFound /> }
          />
        </Route>

        <Route element={ <PublicOnlyRoute /> }>
          <Route
            path="auth"
            element={ <Auth /> }
          />
        </Route>
      </Routes>
      { backgroundLocation && <Routes>
        <Route path="p/:code" element={ <PlacementDetailsDialog /> } />
        <Route path="p/:id/:shareToken" element={ <PlacementDetailsDialog /> } />
      </Routes> }
      <Toast.Provider />
    </>
  );
}

export default App;
