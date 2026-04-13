import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { clearGeofencingCache } from '../utils/geofencing';

const SupabaseContext = createContext({});

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadingTimeoutRef = useRef(null);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Safety valve only if getSession() never resolves (network hang). Do not use a short
    // timeout — it fired while profile was still loading and cleared `loading` early, which
    // made `user` null and caused login flashes / blank routes on slow networks.
    loadingTimeoutRef.current = setTimeout(() => {
      if (mounted) {
        console.warn(
          'Auth: getSession() is taking unusually long; clearing loading to avoid an infinite spinner.'
        );
        setLoading(false);
      }
    }, 30000);

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        // Don't restore session if we're in the process of logging out
        if (isLoggingOutRef.current) {
          console.log('⚠️ Skipping session restore - logout in progress');
          clearTimeout(loadingTimeoutRef.current);
          setLoading(false);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        // Session state is known — cancel the safety timeout so it does not fire during
        // fetchUserProfile() (previously a 2s timer caused premature loading=false).
        clearTimeout(loadingTimeoutRef.current);
        
        // Don't restore session if logout is in progress
        if (isLoggingOutRef.current) {
          console.log('⚠️ Ignoring session - logout in progress');
          setLoading(false);
          return;
        }
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in initAuth:', error);
        if (mounted) {
          clearTimeout(loadingTimeoutRef.current);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // initAuth() already calls getSession() + fetchUserProfile. The listener also emits
      // INITIAL_SESSION with the same data — handling both caused duplicate fetches and
      // routing/auth races on refresh (especially on heavy pages like daily report).
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      // If logout is in progress, ignore all auth state changes except SIGNED_OUT
      if (isLoggingOutRef.current && event !== 'SIGNED_OUT') {
        return;
      }
      
      // If we're on the logout page, ignore SIGNED_IN events
      if (event === 'SIGNED_IN' && (window.location.pathname === '/logout' || isLoggingOutRef.current)) {
        return;
      }
      
      // Always trust explicit sign-out from the auth server
      if (event === 'SIGNED_OUT') {
        isLoggingOutRef.current = false; // Reset logout flag
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        localStorage.removeItem('devUser');
        localStorage.removeItem('devUserProfile');
        return;
      }

      // Session can be briefly null during edge cases (tab resume, refresh races).
      // Wiping user on "!session" alone caused blank / logged-out flashes. Confirm with getSession().
      if (!session?.user) {
        try {
          const { data: { session: verified }, error: verifyErr } = await supabase.auth.getSession();
          if (!mounted) return;
          if (verifyErr) {
            console.warn('Auth session verify error:', verifyErr);
          }
          if (!verified?.user) {
            isLoggingOutRef.current = false;
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            localStorage.removeItem('devUser');
            localStorage.removeItem('devUserProfile');
          } else {
            setUser(verified.user);
            await fetchUserProfile(verified.user.id, verified.user.email);
          }
        } catch (e) {
          console.error('Auth session recovery failed:', e);
          if (mounted) setLoading(false);
        }
        return;
      }

      setUser(session.user);
      await fetchUserProfile(session.user.id, session.user.email);
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeoutRef.current);
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to fetch fresh profile with retry
  const fetchFreshProfile = async (userId, userEmail, cacheKey) => {
    // Add a timeout to prevent hanging (increased to 15 seconds for slower connections)
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Profile fetch timeout')), 15000);
    });
    
    const fetchPromise = supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let result;
    try {
      result = await Promise.race([fetchPromise, timeoutPromise]);
      clearTimeout(timeoutId);
    } catch (raceError) {
      clearTimeout(timeoutId);
      // Handle timeout case - try to use cached profile or retry once
      if (raceError.message === 'Profile fetch timeout') {
        console.warn('⚠️ Profile fetch timed out, checking cache or retrying...');
        
        // Check cache first
        const cachedProfile = localStorage.getItem(cacheKey);
        if (cachedProfile) {
          try {
            const parsedCached = JSON.parse(cachedProfile);
            const { _cachedAt, ...profile } = parsedCached;
            console.log('✅ Using cached profile after timeout:', profile);
            setUserProfile(profile);
            return;
          } catch (parseError) {
            console.error('Error parsing cached profile:', parseError);
          }
        }
        
        // Try one more time with shorter timeout
        console.log('🔄 Retrying profile fetch with shorter timeout...');
        try {
          const retryTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
          });
          const retryResult = await Promise.race([fetchPromise, retryTimeoutPromise]);
          clearTimeout(timeoutId);
          const { data, error } = retryResult;
          if (error) throw error;
          // Cache the successful result
          const profileToCache = { ...data, _cachedAt: Date.now() };
          localStorage.setItem(cacheKey, JSON.stringify(profileToCache));
          setUserProfile(data);
          return;
        } catch (retryError) {
          // If retry also fails, use cached or default
          const cachedProfile = localStorage.getItem(cacheKey);
          if (cachedProfile) {
            try {
              const parsedCached = JSON.parse(cachedProfile);
              const { _cachedAt, ...profile } = parsedCached;
              console.log('✅ Using cached profile after retry failure:', profile);
              setUserProfile(profile);
              return;
            } catch (parseError) {
              console.error('Error parsing cached profile:', parseError);
            }
          }
          // Last resort: infer role from email
          const defaultRole = userEmail && userEmail.includes('admin') ? 'admin' : 'employee';
          throw new Error(`Profile fetch failed: ${retryError.message}. Using inferred role: ${defaultRole}`);
        }
      }
      // Re-throw other errors
      throw raceError;
    }
    
    const { data, error } = result;

    if (error) {
      console.error('Error fetching user profile:', error);
      // If user profile doesn't exist, create a default one
      if (error.code === 'PGRST116') {
        console.log('User profile not found, creating default profile');
        const defaultRole = userEmail && userEmail.includes('admin') ? 'admin' : 'employee';
        const defaultProfile = {
          id: userId,
          email: userEmail || '',
          first_name: '',
          last_name: '',
          role: defaultRole
        };
        setUserProfile(defaultProfile);
        console.log('✅ Default profile set:', defaultProfile);
      } else {
        console.log('❌ Other error, checking cache...');
        // Try to use cached profile
        const cachedProfile = localStorage.getItem(cacheKey);
        if (cachedProfile) {
          try {
            const parsedCached = JSON.parse(cachedProfile);
            const { _cachedAt, ...profile } = parsedCached;
            console.log('✅ Using cached profile after error:', profile);
            setUserProfile(profile);
            return;
          } catch (parseError) {
            console.error('Error parsing cached profile:', parseError);
          }
        }
        setUserProfile(null);
      }
    } else {
      // Cache the successful result
      const profileToCache = { ...data, _cachedAt: Date.now() };
      localStorage.setItem(cacheKey, JSON.stringify(profileToCache));
      setUserProfile(data);
    }
  };

  const fetchUserProfile = async (userId, userEmail = '') => {
    // Define cache key at the top level so it's always available
    const cachedProfileKey = `userProfile_${userId}`;
    
    try {
      // Check for development user profile first
      const devUserProfile = localStorage.getItem('devUserProfile');
      if (devUserProfile) {
        try {
          const parsedProfile = JSON.parse(devUserProfile);
          setUserProfile(parsedProfile);
          clearTimeout(loadingTimeoutRef.current);
          setLoading(false);
          return;
        } catch (parseError) {
          console.error('Error parsing dev user profile:', parseError);
        }
      }
      
      // Check for cached profile in localStorage (from previous successful fetch)
      const cachedProfile = localStorage.getItem(cachedProfileKey);
      if (cachedProfile) {
        try {
          const parsedCached = JSON.parse(cachedProfile);
          // Only use cached profile if it's recent (less than 5 minutes old)
          const cacheAge = Date.now() - (parsedCached._cachedAt || 0);
          if (cacheAge < 5 * 60 * 1000) { // 5 minutes
            // Remove the cache timestamp before setting profile
            const { _cachedAt, ...profile } = parsedCached;
            setUserProfile(profile);
            clearTimeout(loadingTimeoutRef.current);
            setLoading(false);
            // Only fetch fresh data in background if cache is older than 2 minutes
            // This reduces unnecessary network calls
            if (cacheAge > 2 * 60 * 1000) {
              fetchFreshProfile(userId, userEmail, cachedProfileKey).catch(() => {
                // Silently fail background refresh
              });
            }
            return;
          }
        } catch (parseError) {
          console.error('Error parsing cached profile:', parseError);
        }
      }
      
      // Fetch fresh profile with retry logic
      await fetchFreshProfile(userId, userEmail, cachedProfileKey);
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      // Try to use cached profile as fallback
      const cachedProfile = localStorage.getItem(cachedProfileKey);
      if (cachedProfile) {
        try {
          const parsedCached = JSON.parse(cachedProfile);
          const { _cachedAt, ...profile } = parsedCached;
          setUserProfile(profile);
          clearTimeout(loadingTimeoutRef.current);
          setLoading(false);
          return;
        } catch (parseError) {
          console.error('Error parsing cached profile fallback:', parseError);
        }
      }
      // Last resort: default profile (but try to infer role from email)
      const defaultRole = userEmail && userEmail.includes('admin') ? 'admin' : 'employee';
      const defaultProfile = {
        id: userId,
        email: userEmail || '',
        first_name: '',
        last_name: '',
        role: defaultRole
      };
      setUserProfile(defaultProfile);
    } finally {
      clearTimeout(loadingTimeoutRef.current);
      setLoading(false);
    }
  };

  // Do not toggle global `loading` here — AppContent shows a full-screen spinner when loading,
  // which unmounts the Login page and loses inline error state on failed sign-in.
  const looksLikeEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());

  /**
   * Login accepts the real auth email OR a username stored on public.users.username.
   * Supabase Auth still signs in with email; we resolve username → email via RPC when needed.
   */
  const signIn = async (loginIdentifier, password) => {
    const trimmed = (loginIdentifier || '').trim();
    const invalidCreds = () => ({
      data: null,
      error: Object.assign(new Error('Invalid login credentials'), {
        message: 'Invalid login credentials',
      }),
    });

    try {
      let email = trimmed;

      if (!looksLikeEmail(trimmed)) {
        const { data: resolved, error: rpcError } = await supabase.rpc('resolve_login_email', {
          p_login: trimmed,
        });

        const rpcMissing =
          rpcError &&
          ((rpcError.code || '').startsWith('PGRST') &&
            ((rpcError.message || '').toLowerCase().includes('function') ||
              (rpcError.message || '').includes('resolve_login_email')));

        if (rpcError && !rpcMissing) {
          console.error('resolve_login_email:', rpcError);
          return invalidCreds();
        }

        if (rpcMissing) {
          console.warn(
            'Username login unavailable (run supabase/sql/add_username_login.sql in Supabase SQL Editor).'
          );
          return invalidCreds();
        }

        if (resolved && typeof resolved === 'string') {
          email = resolved;
        } else {
          return invalidCreds();
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Starting logout process...');
      clearGeofencingCache();

      // Set logout flag to prevent session restoration
      isLoggingOutRef.current = true;
      
      // Clear user state immediately
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      
      // Clear development user data first
      localStorage.removeItem('devUser');
      localStorage.removeItem('devUserProfile');
      
      // Clear all Supabase session storage
      try {
        // Get the project ref from the Supabase URL to find the exact storage key
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const projectRef = supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : '';
        const authTokenKey = `sb-${projectRef}-auth-token`;
        
        console.log('🗑️ Clearing Supabase storage keys...');
        console.log('🗑️ Looking for key:', authTokenKey);
        
        // Clear the specific auth token key
        localStorage.removeItem(authTokenKey);
        sessionStorage.removeItem(authTokenKey);
        
        // Also clear any keys that start with sb- (Supabase's pattern)
        const allLocalKeys = Object.keys(localStorage);
        const allSessionKeys = Object.keys(sessionStorage);
        
        allLocalKeys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            console.log('🗑️ Removing localStorage key:', key);
            localStorage.removeItem(key);
          }
        });
        
        allSessionKeys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            console.log('🗑️ Removing sessionStorage key:', key);
            sessionStorage.removeItem(key);
          }
        });
        
        console.log('✅ Storage cleared');
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }
      
      // Sign out from Supabase - this should trigger SIGNED_OUT event
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Supabase signOut error:', error);
      } else {
        console.log('✅ Supabase signOut successful');
      }
      
      // Wait a moment to ensure auth state change is processed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force redirect to login page with cache busting
      console.log('🔄 Redirecting to login page...');
      // Use replace to prevent back button issues
      window.location.replace('/login?' + Date.now());
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear everything and redirect
      isLoggingOutRef.current = false; // Reset flag on error
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      localStorage.removeItem('devUser');
      localStorage.removeItem('devUserProfile');
      
      // Clear all Supabase storage
      try {
        Object.keys(localStorage).filter(key => key.startsWith('sb-') || key.includes('auth-token')).forEach(key => localStorage.removeItem(key));
        Object.keys(sessionStorage).filter(key => key.startsWith('sb-') || key.includes('auth-token')).forEach(key => sessionStorage.removeItem(key));
      } catch (e) {}
      
      window.location.replace('/login?' + Date.now());
    }
  };

  // Public self-signup only — for no confirmation, disable "Confirm email" (Supabase Dashboard → Authentication → Providers → Email).
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            role: userData.role || 'employee',
          },
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password || 'defaultpassword123',
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          role: userData.role || 'employee'
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return { data: null, error: authError };
      }

      // The trigger will automatically create the public.users record
      // But let's also manually update it with the provided data
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .update({
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          role: userData.role || 'employee'
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        return { data: null, error: profileError };
      }

      return { data: profileData, error: null };
    } catch (error) {
      console.error('Error in createUser:', error);
      return { data: null, error };
    }
  };

  const getUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUsers:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    signUp,
    createUser,
    getUsers,
    supabase,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};
