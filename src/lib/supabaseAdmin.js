import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://brkbypctkcczerntfpsa.supabase.co'
// You need to get this from your Supabase dashboard -> Settings -> API -> service_role key
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxOTQ4MSwiZXhwIjoyMDczNzk1NDgxfQ.cYWIFwvE3FvF3rVfcP8HOuppqD71t44kdHk6Ti0Z5cw' // Replace with your actual service role key

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
