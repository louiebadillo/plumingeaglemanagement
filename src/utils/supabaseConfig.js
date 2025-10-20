// Supabase configuration utilities
// This file centralizes all Supabase configuration to avoid hardcoded keys

export const getSupabaseConfig = () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

  if (!supabaseServiceKey) {
    console.error('⚠️ REACT_APP_SUPABASE_SERVICE_KEY not found in environment variables!');
    console.error('Please set REACT_APP_SUPABASE_SERVICE_KEY in your .env file');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceKey
  };
};

export const getSupabaseHeaders = () => {
  const { supabaseServiceKey } = getSupabaseConfig();
  
  return {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };
};
