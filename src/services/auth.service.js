import { supabase } from './supabase';

export const authService = {
  signUp: async (email, password) => {
    return await supabase.auth.signUp({ email, password });
  },
  
  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  getSession: async () => {
    return await supabase.auth.getSession();
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
