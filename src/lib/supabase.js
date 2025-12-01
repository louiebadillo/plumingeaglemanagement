import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://brkbypctkcczerntfpsa.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTk0ODEsImV4cCI6MjA3Mzc5NTQ4MX0.SPaPOjLKgOb68CrkaFp4B7LBAZX2eW-unoxSe0OeklE'

// Singleton pattern: Ensure only one client instance is created
let supabaseInstance = null;

// Get project ref for unique storage key
const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'brkbypctkcczerntfpsa';

// Create Supabase client with explicit auth configuration (singleton)
// This ensures only one GoTrueClient instance is created
// Supabase automatically generates a unique storage key based on the project URL
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Keep autoRefreshToken enabled for normal operation
        autoRefreshToken: true,
        // Keep persistSession enabled for normal operation
        persistSession: true,
        // Use localStorage for session storage (default)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Detect session from URL (for OAuth callbacks)
        detectSessionInUrl: true,
        // Flow type
        flowType: 'pkce'
      }
    });
    console.log('✅ Supabase client initialized (singleton) - project: ' + projectRef);
  }
  return supabaseInstance;
})();
