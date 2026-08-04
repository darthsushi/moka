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

    const hydrateSession = async (session) => {
      const requestId = ++authRequestId;

      if (not(session?.user)) {
        if (isMounted && requestId === authRequestId) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }

        return;
      }

      setLoading(true);
      setUser(session.user);

      const userProfile = await profileService.getProfile(session.user.id);

      if (isMounted && requestId === authRequestId) {
        setProfile(userProfile);
        setLoading(false);
      }
    };

    const initializeAuth = async () => {
      const { data: { session }, error } = await authService.getSession();

      if (error) {
        console.error('Error initializing auth:', error);
        await hydrateSession(null);
        
        return;
      }

      await hydrateSession(session);
    };

    initializeAuth();

    const { data: authListener } = authService.onAuthStateChange((_event, session) => {
      // Supabase recomienda no ejecutar otras llamadas async dentro de este callback.
      window.setTimeout(() => {
        if (isMounted) {
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
  }

  return (
    <AuthContext.Provider value={ value }>
      { children }
    </AuthContext.Provider>
  );
};
