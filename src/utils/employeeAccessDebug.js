/**
 * One-shot diagnostic helper for on-site troubleshooting.
 *
 * Open DevTools → Console and run:
 *   await window.pemDebug.run()
 *
 * It prints (in this order):
 *   1. Auth user id, email, role, and any profile facility id.
 *   2. Browser geolocation (lat/lng + accuracy) and which facility, if any,
 *      the device is inside according to the configured geofences.
 *   3. The same client query Dashboard uses, so we can see exactly what comes
 *      back for this user at this location.
 *
 * Nothing is mutated. Safe to run any number of times.
 */

import { supabase } from '../lib/supabase';
import {
  clearGeofencingCache,
  getCurrentFacilityFromGeofencing,
  getLastGeofenceReport,
} from './geofencing';

const TAG = '[PEM-DEBUG]';

const log = (...args) => {
  try { console.info(TAG, ...args); } catch (e) { /* ignore */ }
};

const warn = (...args) => {
  try { console.warn(TAG, ...args); } catch (e) { /* ignore */ }
};

const err = (...args) => {
  try { console.error(TAG, ...args); } catch (e) { /* ignore */ }
};

async function dumpAuth() {
  const { data: { user } = {}, error: authError } = await supabase.auth.getUser();
  if (authError) {
    err('supabase.auth.getUser() failed.', authError);
    return null;
  }
  if (!user) {
    warn('No authenticated user. The employee may not be logged in.');
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    err('Failed to load user_profiles row.', profileError);
  }

  const summary = {
    userId: user.id,
    email: user.email,
    profileRole: profile?.role || null,
    profileFacilityId: profile?.facility_id || null,
    profileExists: !!profile,
  };
  log('Auth summary', summary);
  return summary;
}

async function dumpClientsForFacility(facilityId) {
  if (!facilityId) {
    warn('No facility id resolved — skipping client query.');
    return null;
  }

  const { data, error: qError } = await supabase
    .from('clients')
    .select('id, first_name, last_name, status, facility_id')
    .eq('facility_id', facilityId)
    .limit(200);

  if (qError) {
    err(
      'clients query failed for facility ' + facilityId + '. ' +
        'If this is a 42501 / row-level security error, the employee\'s row in user_profiles ' +
        'is missing or has the wrong role/facility for this facility.',
      qError
    );
    return null;
  }

  const all = data || [];
  const active = all.filter((c) => (c.status || '').toLowerCase() !== 'discharged');
  log('Client query result', {
    facilityId,
    totalRows: all.length,
    activeRows: active.length,
    sampleIds: all.slice(0, 5).map((c) => c.id),
    statuses: Array.from(new Set(all.map((c) => c.status))),
  });

  if (all.length === 0) {
    warn(
      'No clients returned. Either no clients are assigned to this facility ' +
        'or RLS is blocking this user. Check user_profiles.role / facility_id.'
    );
  }
  return { totalRows: all.length, activeRows: active.length };
}

export async function runEmployeeAccessDiagnostics() {
  log('=== START employee access diagnostic ===');
  const auth = await dumpAuth();

  // Force a fresh GPS read so the cached "outside" decision doesn't hide the
  // real result.
  clearGeofencingCache();
  const facilityId = await getCurrentFacilityFromGeofencing();
  const geoReport = getLastGeofenceReport();
  log('Geofence report', geoReport);

  if (!facilityId) {
    warn(
      'Geofence did NOT match any facility. The employee will not see clients. ' +
        'See the [PEM-GEO] log just above for per-facility distances.'
    );
  }

  const clientResult = await dumpClientsForFacility(facilityId);

  log('=== END employee access diagnostic ===');
  return {
    auth,
    geofence: geoReport,
    matchedFacilityId: facilityId,
    clients: clientResult,
  };
}

if (typeof window !== 'undefined') {
  window.pemDebug = window.pemDebug || {};
  window.pemDebug.run = runEmployeeAccessDiagnostics;
  window.pemDebug.getLastGeofenceReport = getLastGeofenceReport;
  window.pemDebug.clearGeofencingCache = clearGeofencingCache;
}
