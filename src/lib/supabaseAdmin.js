import { createClient } from '@supabase/supabase-js'

// Use environment variables for security - NEVER commit service keys to git
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('⚠️ REACT_APP_SUPABASE_SERVICE_KEY not found in environment variables!');
  console.error('Please set REACT_APP_SUPABASE_SERVICE_KEY in your .env file');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
