import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://brkbypctkcczerntfpsa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTk0ODEsImV4cCI6MjA3Mzc5NTQ4MX0.SPaPOjLKgOb68CrkaFp4B7LBAZX2eW-unoxSe0OeklE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
