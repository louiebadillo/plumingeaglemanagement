import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase configuration!');
  console.error('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file');
}

// Singleton pattern: Ensure only one client instance is created
let supabaseInstance = null;

// Get project ref for unique storage key (fallback to empty string if URL not set)
const projectRef = supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : '';

// Create Supabase client with explicit auth configuration (singleton)
// This ensures only one GoTrueClient instance is created
// Supabase automatically generates a unique storage key based on the project URL
export const supabase = (() => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    }
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
