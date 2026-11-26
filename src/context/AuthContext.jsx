import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export function getOAuthUserDetails(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  const isGuest = !!user.is_guest || user.id?.startsWith('guest_');

  const provider = isGuest
    ? 'guest'
    : appMeta.provider || (user.email ? 'email' : 'unknown');

  const avatarUrl =
    meta.avatar_url ||
    meta.picture ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id || 'fastian'}`;

  const fullName = meta.full_name || meta.name || '';
  const username =
    meta.user_name ||
    meta.preferred_username ||
    (user.email ? user.email.split('@')[0] : 'fastian');

  return {
    provider,
    avatarUrl,
    fullName,
    username,
    email: user.email || '',
    isGuest,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // 1. Check for OAuth redirect errors in the URL hash or query params
    const hash = window.location.hash;
    const search = window.location.search;

    if (hash && (hash.includes('error=') || hash.includes('error_description='))) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const desc = params.get('error_description') || params.get('error');
      if (desc) {
        setAuthError(decodeURIComponent(desc.replace(/\+/g, ' ')));
        window.history.replaceState(null, '', window.location.pathname);
      }
    } else if (search && search.includes('error=')) {
      const params = new URLSearchParams(search);
      const desc = params.get('error_description') || params.get('error');
      if (desc) {
        setAuthError(decodeURIComponent(desc.replace(/\+/g, ' ')));
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // 2. Check initial active session from Supabase
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Initial session fetch error:', error);
      }
      if (session) {
        setSession(session);
        setUser(session.user);
        // Clean URL after successful OAuth callback
        if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        // Check for local guest session
        const savedGuest = localStorage.getItem('fastudy_guest_session');
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            setUser(parsed);
          } catch {
            localStorage.removeItem('fastudy_guest_session');
          }
        }
      }
      setLoading(false);
    });

    // 3. Listen for auth state changes (OAuth redirects, logins, signouts)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        localStorage.removeItem('fastudy_guest_session');

        // Clean code/token from address bar
        if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        localStorage.removeItem('fastudy_guest_session');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOAuth = async (provider = 'google', redirectPath = '') => {
    setAuthError(null);
    try {
      const targetPath = redirectPath || `${window.location.pathname}${window.location.search}`;
      try {
        sessionStorage.setItem('fastudy_auth_return_url', targetPath);
      } catch {
        // ignore sessionStorage errors
      }

      const redirectUrl = `${window.location.origin}${window.location.pathname}`;

      const options = {
        redirectTo: redirectUrl,
      };

      if (provider === 'google') {
        options.queryParams = {
          access_type: 'offline',
          prompt: 'consent',
        };
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`OAuth error [${provider}]:`, error);
      let userFriendlyMessage = error.message || 'OAuth authentication failed.';
      if (error.message?.includes('provider is not enabled')) {
        userFriendlyMessage = `${provider.toUpperCase()} provider is not enabled in your Supabase project. Enable it under Supabase Dashboard > Authentication > Providers.`;
      } else if (error.message?.includes('redirect_uri_mismatch') || error.message?.includes('validation_failed')) {
        userFriendlyMessage = `Redirect URL mismatch in Supabase settings. Please ensure ${window.location.origin} is added to your Supabase Auth Redirect URLs.`;
      }
      setAuthError(userFriendlyMessage);
      return { data: null, error: { ...error, message: userFriendlyMessage } };
    }
  };

  const signInWithEmail = async (email, password) => {
    setAuthError(null);
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) setAuthError(res.error.message);
    return res;
  };

  const signUpWithEmail = async (email, password) => {
    setAuthError(null);
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: email.split('@')[0],
        },
      },
    });
    if (res.error) setAuthError(res.error.message);
    return res;
  };

  const signInAsGuest = (guestName = 'FASTian_Student') => {
    setAuthError(null);
    const mockUser = {
      id: `guest_${Date.now()}`,
      email: `${guestName.toLowerCase().replace(/\s+/g, '_')}@nu.edu.pk`,
      user_metadata: {
        user_name: guestName,
        full_name: guestName,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestName}`,
      },
      is_guest: true,
    };
    setUser(mockUser);
    localStorage.setItem('fastudy_guest_session', JSON.stringify(mockUser));
    return mockUser;
  };

  const signOut = async () => {
    localStorage.removeItem('fastudy_guest_session');
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  const userDetails = getOAuthUserDetails(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authError,
        setAuthError,
        signInWithOAuth,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signOut,
        isAuthenticated: !!user,
        isGuest: !!user?.is_guest || (user?.id ? user.id.startsWith('guest_') : false),
        provider: userDetails?.provider || 'none',
        userDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
