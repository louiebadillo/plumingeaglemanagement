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

// Create Supabase admin client (singleton, no session persistence)
// Admin client doesn't persist sessions, so no storage conflicts
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('Supabase admin client initialized');
    }
  }
  return supabaseAdminInstance;
})();
