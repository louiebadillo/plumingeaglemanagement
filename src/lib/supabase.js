import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase configuration!');
  console.error('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file');
}

// Singleton on module + globalThis so HMR / duplicate bundles cannot create a second
// anon GoTrueClient (avoids "Multiple GoTrueClient instances" and odd auth/tab behavior).
const GLOBAL_ANON = '__pem_supabase_anon_singleton_v1__';
let supabaseInstance = null;

// Get project ref for unique storage key (fallback to empty string if URL not set)
const projectRef = supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : '';

function getOrCreateSupabaseAnon() {
  const g = typeof globalThis !== 'undefined' ? globalThis : null;
  if (g && g[GLOBAL_ANON]) {
    return g[GLOBAL_ANON];
  }
  if (supabaseInstance) {
    if (g) g[GLOBAL_ANON] = supabaseInstance;
    return supabaseInstance;
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  }
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  if (g) g[GLOBAL_ANON] = supabaseInstance;
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase client initialized - project: ' + projectRef);
  }
  return supabaseInstance;
}

export const supabase = getOrCreateSupabaseAnon();
