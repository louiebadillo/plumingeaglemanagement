import { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { getOperationalDate, isReportLocked } from '../utils/dateHelpers';
import { getCurrentFacilityFromGeofencing } from '../utils/geofencing';
import { getSupabaseConfig, getSupabaseHeaders } from '../utils/supabaseConfig';

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
        const { supabaseUrl } = getSupabaseConfig();
        const operationalDate = getOperationalDate();
        
        let queryUrl;
        
        if (isAdmin) {
          // Admin: Count unsubmitted (draft) reports that are locked from employees
          // These are reports past 6:30 AM cutoff (from previous operational dates)
          // Fetch all draft reports and filter by lock status
          queryUrl = `${supabaseUrl}/rest/v1/daily_reports_v2?status=eq.draft&select=id,report_date,status`;
        } else {
          // Employee: Count draft reports for operational date in their geofenced facility
          queryUrl = `${supabaseUrl}/rest/v1/daily_reports_v2?status=eq.draft&facility_id=eq.${currentFacilityId}&report_date=eq.${operationalDate}&select=id,report_date,status,clients(facility_id)`;
        }

        const response = await fetch(queryUrl, {
          method: 'GET',
          headers: getSupabaseHeaders()
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
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
