/**
 * Picks which facility drives the employee dashboard / my-reports when RLS already limits rows.
 * Order: geofence (physical site) → users.facility_id → user_facilities (first if multiple).
 */

export const FACILITY_RESOLUTION = {
  GEOFENCE: 'geofence',
  PROFILE: 'profile',
  USER_FACILITIES: 'user_facilities',
  /** Multiple assignments, no geofence — deterministic first row */
  USER_FACILITIES_MULTI: 'user_facilities_multi',
};

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string|null|undefined} geofenceFacilityId
 * @param {string|null|undefined} profileFacilityId
 * @returns {Promise<{ facilityId: string|null, source: string|null }>}
 */
export async function resolveEmployeeDashboardFacilityId({
  supabase,
  userId,
  geofenceFacilityId,
  profileFacilityId,
}) {
  if (geofenceFacilityId) {
    return { facilityId: geofenceFacilityId, source: FACILITY_RESOLUTION.GEOFENCE };
  }
  if (profileFacilityId) {
    return { facilityId: profileFacilityId, source: FACILITY_RESOLUTION.PROFILE };
  }

  const { data, error } = await supabase
    .from('user_facilities')
    .select('facility_id')
    .eq('user_id', userId)
    .order('facility_id', { ascending: true });

  if (error || !data?.length) {
    return { facilityId: null, source: null };
  }
  if (data.length === 1) {
    return { facilityId: data[0].facility_id, source: FACILITY_RESOLUTION.USER_FACILITIES };
  }
  return {
    facilityId: data[0].facility_id,
    source: FACILITY_RESOLUTION.USER_FACILITIES_MULTI,
  };
}
