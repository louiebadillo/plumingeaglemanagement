/**
 * Lazy-loads the service-role Supabase client so the app does not instantiate a second
 * GoTrueClient on initial load (avoids "Multiple GoTrueClient instances" for every visit).
 * The admin client is only needed for staff management and legacy user-management actions.
 */
export async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import('./supabaseAdmin');
  return supabaseAdmin;
}
