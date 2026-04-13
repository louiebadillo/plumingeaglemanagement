import { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { getOperationalDate } from '../utils/dateHelpers';
import { getCurrentFacilityFromGeofencing } from '../utils/geofencing';
import { supabase } from '../lib/supabase';

export const useDraftReportsCount = () => {
  const { userProfile } = useSupabase();
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentFacilityId, setCurrentFacilityId] = useState(null);
  const [geofenceResolved, setGeofenceResolved] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  // Resolve geofence for employees only (no profile facility fallback)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userProfile?.id) {
        setCurrentFacilityId(null);
        setGeofenceResolved(true);
        return;
      }
      if (isAdmin) {
        setCurrentFacilityId(null);
        setGeofenceResolved(true);
        return;
      }

      setGeofenceResolved(false);
      // Do not clear geofence cache here — Layout mounts after Dashboard; clearing would
      // wipe a fresh dashboard read and force a second GPS call.
      const id = await getCurrentFacilityFromGeofencing();
      if (!cancelled) {
        setCurrentFacilityId(id);
        setGeofenceResolved(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userProfile?.id, isAdmin]);

  useEffect(() => {
    const fetchDraftCount = async () => {
      if (!userProfile?.id) {
        setDraftCount(0);
        setLoading(false);
        return;
      }

      if (!geofenceResolved) {
        return;
      }

      if (!isAdmin && !currentFacilityId) {
        setDraftCount(0);
        setLoading(false);
        return;
      }

      try {
        const operationalDate = getOperationalDate();

        let query = supabase
          .from('daily_reports_v2')
          .select('id, report_date, status');

        if (isAdmin) {
          query = query.eq('status', 'draft');
        } else {
          query = query
            .eq('status', 'draft')
            .eq('facility_id', currentFacilityId)
            .eq('report_date', operationalDate)
            .select('id, report_date, status, clients(facility_id)');
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch draft reports: ${error.message}`);
        }

        let count = 0;

        if (isAdmin) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTime = currentHour * 60 + currentMinute;
          const cutoffTime = 6 * 60 + 30;

          if (currentTime >= cutoffTime) {
            count = data.filter((report) => {
              const reportDate = report.report_date?.split('T')[0];
              const reportDateObj = new Date(reportDate);
              const operationalDateObj = new Date(operationalDate);
              return reportDateObj < operationalDateObj;
            }).length;
          } else {
            count = 0;
          }
        } else {
          count = data.filter((report) => {
            const clientFacilityId = report.clients?.facility_id;
            const reportDate = report.report_date?.split('T')[0];
            return clientFacilityId === currentFacilityId && reportDate === operationalDate;
          }).length;
        }

        setDraftCount(count);
      } catch (err) {
        console.error('Error fetching draft count:', err);
        setDraftCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDraftCount();
  }, [userProfile?.id, isAdmin, currentFacilityId, geofenceResolved]);

  return { draftCount, loading };
};
