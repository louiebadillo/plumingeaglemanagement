import { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { getOperationalDate, isReportLocked } from '../utils/dateHelpers';
import { getCurrentFacilityFromGeofencing } from '../utils/geofencing';
import { supabase } from '../lib/supabase';

export const useDraftReportsCount = () => {
  const { supabase, userProfile } = useSupabase();
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentFacilityId, setCurrentFacilityId] = useState(null);

  const isAdmin = userProfile?.role === 'admin';
  const employeeFacilityId = userProfile?.facility_id;

  // Get current facility from geofencing (for employees)
  useEffect(() => {
    const detectFacility = async () => {
      if (isAdmin || !userProfile) {
        setCurrentFacilityId(null);
        return;
      }

      try {
        let facilityId = await getCurrentFacilityFromGeofencing();
        if (!facilityId) {
          facilityId = employeeFacilityId;
        }
        setCurrentFacilityId(facilityId);
      } catch (err) {
        console.error('Error detecting facility:', err);
        setCurrentFacilityId(employeeFacilityId);
      }
    };

    detectFacility();
  }, [userProfile, isAdmin, employeeFacilityId]);

  useEffect(() => {
    const fetchDraftCount = async () => {
      if (!userProfile?.id) {
        setDraftCount(0);
        setLoading(false);
        return;
      }

      // For employees, wait for facility detection
      if (!isAdmin && !currentFacilityId) {
        return; // Wait for facility to be detected
      }

      try {
        // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
        const operationalDate = getOperationalDate();
        
        let query = supabase
          .from('daily_reports_v2')
          .select('id, report_date, status');
        
        if (isAdmin) {
          // Admin: Count unsubmitted (draft) reports that are locked from employees
          // These are reports past 6:30 AM cutoff (from previous operational dates)
          // Fetch all draft reports and filter by lock status
          query = query.eq('status', 'draft');
        } else {
          // Employee: Count draft reports for operational date in their geofenced facility
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
          // For admins: Count only locked reports (past 6:30 AM cutoff)
          // Check if report date is before current operational date and current time >= 6:30 AM
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTime = currentHour * 60 + currentMinute; // Total minutes since midnight
          const cutoffTime = 6 * 60 + 30; // 6:30 AM in minutes
          
          if (currentTime >= cutoffTime) {
            // After 6:30 AM, count reports from dates before current operational date
            count = data.filter(report => {
              const reportDate = report.report_date?.split('T')[0];
              const reportDateObj = new Date(reportDate);
              const operationalDateObj = new Date(operationalDate);
              return reportDateObj < operationalDateObj;
            }).length;
          } else {
            // Before 6:30 AM, no locked reports
            count = 0;
          }
        } else {
          // For employees: Count reports for operational date in their facility
          // Additional filter to ensure only clients in the geofenced facility
          count = data.filter(report => {
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
  }, [supabase, userProfile, isAdmin, currentFacilityId]);

  return { draftCount, loading };
};
