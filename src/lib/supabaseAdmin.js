import { createClient } from '@supabase/supabase-js'

// Use environment variables for security - NEVER commit service keys to git
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('REACT_APP_SUPABASE_SERVICE_KEY not found in environment variables!');
  console.error('Please set REACT_APP_SUPABASE_SERVICE_KEY in your .env file');
}

// Singleton on module + globalThis (HMR-safe). Uses in-memory auth only — never localStorage.
const GLOBAL_ADMIN = '__pem_supabase_admin_singleton_v1__';
let supabaseAdminInstance = null;

// Get project ref for unique storage key
const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0] || 'default';

const noopAuthStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getOrCreateSupabaseAdmin() {
  const g = typeof globalThis !== 'undefined' ? globalThis : null;
  if (g && g[GLOBAL_ADMIN]) {
    return g[GLOBAL_ADMIN];
  }
  if (supabaseAdminInstance) {
    if (g) g[GLOBAL_ADMIN] = supabaseAdminInstance;
    return supabaseAdminInstance;
  }
  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: typeof window !== 'undefined' ? noopAuthStorage : undefined,
      storageKey: `sb-${projectRef}-admin-service`,
    },
  });
  if (g) g[GLOBAL_ADMIN] = supabaseAdminInstance;
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase admin client initialized');
  }
  return supabaseAdminInstance;
}

export const supabaseAdmin = getOrCreateSupabaseAdmin();
