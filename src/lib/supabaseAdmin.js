import { createClient } from '@supabase/supabase-js'

// Use environment variables for security - NEVER commit service keys to git
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('⚠️ REACT_APP_SUPABASE_SERVICE_KEY not found in environment variables!');
  console.error('Please set REACT_APP_SUPABASE_SERVICE_KEY in your .env file');
}

// Singleton pattern: Ensure only one admin client instance is created
let supabaseAdminInstance = null;

// Get project ref for unique storage key
const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0] || 'default';

// In-memory auth storage so this client never shares localStorage with the anon `supabase`
// client — avoids "Multiple GoTrueClient instances" / undefined concurrent behavior.
const noopAuthStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Create Supabase admin client (singleton, no session persistence)
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storage: typeof window !== 'undefined' ? noopAuthStorage : undefined,
        storageKey: `sb-${projectRef}-admin-service`,
      },
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('Supabase admin client initialized');
    }
  }
  return supabaseAdminInstance;
})();
