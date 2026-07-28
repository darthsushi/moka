/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service.js';
import { profileService } from '../services/profile.service.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await authService.getSession();
      
      if (session?.user) {
        setUser(session.user);
        const userProfile = await profileService.getProfile(session.user.id);
        setProfile(userProfile);
      }

      setLoading(false);
    }

    initializeAuth();

    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const userProfile = await profileService.getProfile(session.user.id);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    
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
