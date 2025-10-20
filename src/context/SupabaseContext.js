import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    let mounted = true;

    // Set a timeout to prevent infinite loading
    loadingTimeoutRef.current = setTimeout(() => {
      if (mounted) {
        console.log('Auth loading timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          clearTimeout(loadingTimeoutRef.current);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in initAuth:', error);
        if (mounted) {
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
      
      console.log('🔄 Auth state change:', event, session?.user?.id || 'no user');
      
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
      } else {
        console.log('🔄 User logged out, clearing profile and stopping loading');
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeoutRef.current);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId, userEmail = '') => {
    try {
      console.log('🔄 Fetching user profile for:', userId, 'email:', userEmail);
      
      // Check for development user profile first
      const devUserProfile = localStorage.getItem('devUserProfile');
      if (devUserProfile) {
        try {
          const parsedProfile = JSON.parse(devUserProfile);
          console.log('✅ Using development user profile:', parsedProfile);
          setUserProfile(parsedProfile);
          clearTimeout(loadingTimeoutRef.current);
          setLoading(false);
          return;
        } catch (parseError) {
          console.error('Error parsing dev user profile:', parseError);
        }
      }
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('Error fetching user profile:', error);
        // If user profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating default profile');
          const defaultProfile = {
            id: userId,
            email: userEmail || '',
            first_name: '',
            last_name: '',
            role: 'employee'
          };
          setUserProfile(defaultProfile);
          console.log('✅ Default profile set:', defaultProfile);
        } else {
          console.log('❌ Other error, setting profile to null');
          setUserProfile(null);
        }
      } else {
        console.log('✅ User profile fetched successfully:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      // Create a default profile on any error
      const defaultProfile = {
        id: userId,
        email: userEmail || '',
        first_name: '',
        last_name: '',
        role: 'employee'
      };
      setUserProfile(defaultProfile);
      console.log('✅ Default profile set due to error:', defaultProfile);
    } finally {
      console.log('🔄 Clearing timeout and setting loading to false');
      clearTimeout(loadingTimeoutRef.current);
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Starting logout process...');
      // Clear user state immediately
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      
      // Clear development user data
      localStorage.removeItem('devUser');
      localStorage.removeItem('devUserProfile');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      } else {
        console.log('✅ Supabase signOut successful');
      }
      
      // Force redirect to login page
      console.log('🔄 Redirecting to login page...');
      window.location.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear the user state and redirect
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      localStorage.removeItem('devUser');
      localStorage.removeItem('devUserProfile');
      window.location.replace('/login');
    }
  };

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
