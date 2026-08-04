import { Toast } from '@heroui/react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { MODULES } from '@/settings/navigation.settings';

import { AppLayout } from '@/components/layouts';
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from '@/router';
import { AccessDenied, Auth, HomePage, Inventory, NotFound } from '@/components/views';

import './App.css';

function App() {

  return (
    <>
      <Routes>
        <Route element={ <AppLayout /> }>
          <Route index element={ <HomePage /> } />
          <Route path="home" element={ <Navigate to="/" replace /> } />
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
      <Toast.Provider />
    </>
  );
}

export default App;
