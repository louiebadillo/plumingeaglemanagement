import { supabase } from '../lib/supabase';

const TABLE = 'location_help_requests';

export const LOCATION_HELP_REQUESTS_CHANGED = 'locationHelpRequestsChanged';

export function notifyLocationHelpRequestsChanged() {
  window.dispatchEvent(new CustomEvent(LOCATION_HELP_REQUESTS_CHANGED));
}

export async function submitLocationHelpRequest({
  userId,
  userEmail,
  userDisplayName,
  reportText,
  reportPayload,
  matchedFacilityId,
  matchedFacilityName,
  device,
}) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      user_email: userEmail || null,
      user_display_name: userDisplayName || null,
      status: 'open',
      report_text: reportText,
      report_payload: reportPayload || null,
      matched_facility_id: matchedFacilityId || null,
      matched_facility_name: matchedFacilityName || null,
      device_lat: device?.lat ?? null,
      device_lng: device?.lng ?? null,
      device_accuracy_meters: device?.accuracyMeters ?? null,
    })
    .select('id, created_at, status')
    .single();

  if (error) throw error;
  notifyLocationHelpRequestsChanged();

  // Notify admin by email (Resend via Edge Function). Non-blocking for the employee.
  try {
    const { error: notifyError } = await supabase.functions.invoke(
      'notify-location-help-request',
      { body: { requestId: data.id } },
    );
    if (notifyError) {
      console.warn('Admin email notification failed:', notifyError.message);
    }
  } catch (notifyErr) {
    console.warn('Admin email notification failed:', notifyErr);
  }

  return data;
}

export async function fetchOpenLocationHelpRequestCount() {
  const { count, error } = await supabase
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  if (error) throw error;
  return count || 0;
}

export async function fetchLocationHelpRequests({ statusFilter = 'open' } = {}) {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter === 'open') {
    query = query.eq('status', 'open');
  } else if (statusFilter === 'resolved') {
    query = query.eq('status', 'resolved');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function resolveLocationHelpRequest(requestId, resolvedByUserId) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedByUserId,
    })
    .eq('id', requestId)
    .eq('status', 'open')
    .select('id, status, resolved_at')
    .maybeSingle();

  if (error) throw error;
  notifyLocationHelpRequestsChanged();
  return data;
}
