/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';

import { authService } from '@/services/auth.service.js';
import { profileService } from '@/services/profile.service.js';
import { not } from '@/helpers/ramda.helpers';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authRequestId = 0;
    let profileUserId = null;
    let pendingProfileUserId = null;

    const clearSession = () => {
      authRequestId += 1;
      profileUserId = null;
      pendingProfileUserId = null;

      if (isMounted) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    const hydrateSession = async (session) => {
      if (not(session?.user)) {
        clearSession();
        return;
      }

      const userId = session.user.id;
      const requestId = ++authRequestId;

      pendingProfileUserId = userId;

      if (isMounted) {
        setUser(session.user);
        setProfile(null);
        setLoading(true);
      }

      const userProfile = await profileService.getProfile();

      if (isMounted && requestId === authRequestId) {
        profileUserId = userId;
        pendingProfileUserId = null;
        setProfile(userProfile);
        setLoading(false);
      }
    };

    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      // Supabase recomienda no ejecutar otras llamadas async dentro de este callback.
      window.setTimeout(() => {
        if (not(isMounted)) {
          return;
        }

        if (event === 'SIGNED_OUT' || not(session?.user)) {
          clearSession();
          return;
        }

        // Estos eventos pueden repetirse al volver a enfocar la pestaña.
        // La sesión se actualiza, pero el perfil solo se consulta una vez por usuario.
        setUser(session.user);

        const hasProfile = profileUserId === session.user.id;
        const isLoadingProfile = pendingProfileUserId === session.user.id;

        if (not(hasProfile) && not(isLoadingProfile)) {
          hydrateSession(session);
        }
      }, 0);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const roles = profile?.roles || [];
  const value = {
    user,
    profile,
    roles,
    loading,
    isAuthenticated: Boolean(user),
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (allowedRoles = []) => (
      allowedRoles.some(role => roles.includes(role))
    ),
    
    signUp: authService.signUp,
    signIn: authService.signIn,
    signOut: authService.signOut
  };

  return (
    <AuthContext.Provider value={ value }>
      { children }
    </AuthContext.Provider>
  );
};
