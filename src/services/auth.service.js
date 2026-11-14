import { supabase } from './supabase';

// Subscribe before React mounts so a recovery event is not lost while the
// client exchanges the email link for a session.
let recoveryUserId = null;
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') recoveryUserId = session?.user?.id ?? null;
  if (event === 'SIGNED_OUT') recoveryUserId = null;
});

export const authService = {
  isRecoverySession: session => Boolean(session?.user?.id && session.user.id === recoveryUserId),
  signUp: async (email, password, name) => {
    return await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth` }
    });
  },

  resetPassword: async (email) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
  },

  updatePassword: async (password) => {
    return await supabase.auth.updateUser({ password });
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
