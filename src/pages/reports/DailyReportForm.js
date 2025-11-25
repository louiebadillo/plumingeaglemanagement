import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';
import AppointmentsManager from '../../components/DailyReport/AppointmentsManager';
import BIRManager from '../../components/DailyReport/BIRManager';
import AWOLManager from '../../components/DailyReport/AWOLManager';
import InjuriesManager from '../../components/DailyReport/InjuriesManager';
import { uploadFile } from '../../utils/fileUpload';
import { isReportLocked, getOperationalDate } from '../../utils/dateHelpers';

// Initial form data structure
const initialFormData = {
  // Morning shift fields
  medication_required: null,
  medication_status: '',
  sleep_woke_on_time: null,
  diet_ate_well: null,
  dental_hygiene_done: null,
  routine_made_bed: null,
  routine_put_clothes_away: null,
  routine_cleared_floor: null,
  routine_washed_dishes: null,
  behaviour_observation: null, // Changed from '' to null to satisfy check constraint
  behaviour_followed_rules: null,
  behaviour_listened: null,
  behaviour_control: null,
  
  // Afternoon shift fields
  afternoon_medication_required: null,
  afternoon_medication_status: '',
  afternoon_slept_on_time: null,
  afternoon_diet_ate_well: null,
  afternoon_dental_hygiene_done: null,
  afternoon_shower_taken: null,
  afternoon_routine_made_bed: null,
  afternoon_routine_put_clothes_away: null,
  afternoon_routine_cleared_floor: null,
  afternoon_routine_washed_dishes: null,
  afternoon_school_supposed_to_go: null,
  afternoon_school_status: '',
  afternoon_behaviour_observation: null,
  afternoon_behaviour_followed_rules: null,
  afternoon_behaviour_listened: null,
  afternoon_behaviour_control: null,
  
  // Evening shift fields
  evening_medication_required: null,
  evening_medication_status: '',
  appointments: [],
  bir_incidents: null,
  awol_incidents: [],
  injuries: []
};

// Field update tracking - matches database schema exactly
const initialFieldTracking = {
  // Morning shift tracking
  medication_updated_by: null,
  sleep_updated_by: null,
  diet_updated_by: null,
  dental_updated_by: null,
  routine_made_bed_updated_by: null,
  routine_put_clothes_away_updated_by: null,
  routine_cleared_floor_updated_by: null,
  routine_washed_dishes_updated_by: null,
  behaviour_observation_updated_by: null,
  behaviour_followed_rules_updated_by: null,
  behaviour_listened_updated_by: null,
  behaviour_control_updated_by: null,
  
  // Afternoon shift tracking
  afternoon_medication_updated_by: null,
  afternoon_slept_on_time_updated_by: null,
  afternoon_diet_updated_by: null,
  afternoon_dental_updated_by: null,
  afternoon_shower_updated_by: null,
  afternoon_routine_made_bed_updated_by: null,
  afternoon_routine_put_clothes_away_updated_by: null,
  afternoon_routine_cleared_floor_updated_by: null,
  afternoon_routine_washed_dishes_updated_by: null,
  afternoon_school_updated_by: null,
  afternoon_behaviour_observation_updated_by: null,
  afternoon_behaviour_followed_rules_updated_by: null,
  afternoon_behaviour_listened_updated_by: null,
  afternoon_behaviour_control_updated_by: null,
  
  // Evening shift tracking
  evening_medication_updated_by: null,
  appointments_updated_by: null,
  bir_updated_by: null,
  awol_updated_by: null,
  injury_updated_by: null
};

function DailyReportForm() {
  const history = useHistory();
  const location = useLocation();
  const { userProfile } = useSupabase();
  
  // Get parameters from URL
  const urlParams = new URLSearchParams(location.search);
  const clientId = urlParams.get('clientId');
  const reportDate = urlParams.get('date');
  let facilityId = urlParams.get('facility'); // This is correct - the URL param is 'facility'
  // Handle string "null" or "undefined" - convert to actual null
  if (facilityId === 'null' || facilityId === 'undefined' || !facilityId) {
    facilityId = null;
  }
  const reportId = urlParams.get('reportId');
  
  console.log('🔍 DailyReportForm URL params:', { clientId, reportDate, facilityId, reportId, search: location.search });
  console.log('🔍 Report date from URL (raw):', reportDate, 'Type:', typeof reportDate);
  
  // Validate and normalize the date format (should be YYYY-MM-DD)
  let normalizedReportDate = reportDate;
  if (reportDate) {
    // Ensure it's in YYYY-MM-DD format (no time component)
    normalizedReportDate = reportDate.split('T')[0].split(' ')[0];
    if (normalizedReportDate !== reportDate) {
      console.log('🔍 Normalized report date from', reportDate, 'to', normalizedReportDate);
    }
  }
  
  // Use normalized date for all operations
  const effectiveReportDate = normalizedReportDate;
  
  // State
  const [client, setClient] = useState(null);
  const [facility, setFacility] = useState(null);
  const [actualFacilityId, setActualFacilityId] = useState(null); // Store the actual facility ID to use
  const [formData, setFormData] = useState(initialFormData);
  const [fieldTracking, setFieldTracking] = useState(initialFieldTracking);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showSubmitWarningDialog, setShowSubmitWarningDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  
  const userRole = userProfile?.role || 'employee';
  const isAdmin = userRole === 'admin';
  const currentUserId = userProfile?.id;

  // Load client and facility data
  useEffect(() => {
    if (clientId) {
      loadClientAndFacility();
    }
  }, [clientId, facilityId]);

  // Load existing report if it exists
  useEffect(() => {
    if (clientId && effectiveReportDate) {
      loadClientAndFacility();
      loadExistingReport();
    }
  }, [clientId, effectiveReportDate, location.search]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData && Object.values(formData).some(value => value !== null && value !== '')) {
        handleSave('draft', true); // Silent save
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData]);

  const loadClientAndFacility = async () => {
    try {
      setLoading(true);
      const { supabaseUrl } = getSupabaseConfig();
      
      // Load client with facility information
      const clientResponse = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientId}&select=*,facilities(*)`, {
        method: 'GET',
        headers: getSupabaseHeaders()
      });
      
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        if (clientData && clientData.length > 0) {
          const client = clientData[0];
          setClient(client);
          
          // Determine the actual facility ID to use
          let finalFacilityId = null;
          if (facilityId && facilityId !== 'null' && facilityId !== 'undefined') {
            // Use facilityId from URL if it's valid
            finalFacilityId = facilityId;
          } else if (client.facility_id) {
            // Fall back to client's facility_id
            finalFacilityId = client.facility_id;
          }
          
          setActualFacilityId(finalFacilityId);
          
          // If facilityId is null or missing, try to get it from the client's facility
          if (!facilityId || facilityId === 'null' || facilityId === 'undefined') {
            if (client.facility_id) {
              console.log('🔍 Using client facility_id:', client.facility_id);
              setFacility({ id: client.facility_id, name: client.facilities?.name || 'Unknown Facility' });
              
              // Fix the corrupted report data by updating the facility_id
              if (reportId) {
                console.log('🔧 Fixing corrupted report data - updating facility_id');
                try {
                  const { supabaseUrl } = getSupabaseConfig();
                  await fetch(`${supabaseUrl}/rest/v1/daily_reports_v2?id=eq.${reportId}`, {
                    method: 'PATCH',
                    headers: {
                      ...getSupabaseHeaders(),
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ facility_id: client.facility_id })
                  });
                  console.log('✅ Report facility_id updated successfully');
                } catch (error) {
                  console.error('❌ Failed to update report facility_id:', error);
                }
              }
            } else {
              console.warn('⚠️ No facility_id available from URL or client');
              setFacility(null);
            }
          } else {
            // Load facility separately using the valid facilityId
            const facilityResponse = await fetch(`${supabaseUrl}/rest/v1/facilities?id=eq.${facilityId}`, {
              method: 'GET',
              headers: getSupabaseHeaders()
            });
            
            if (facilityResponse.ok) {
              const facilityData = await facilityResponse.json();
              if (facilityData && facilityData.length > 0) {
                setFacility(facilityData[0]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading client and facility:', error);
      setError('Failed to load client and facility data');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingReport = async () => {
    try {
      const dateToUse = effectiveReportDate;
      console.log('🔍 Loading existing report for:', { clientId, dateToUse });
      console.log('🔍 URL reportDate (raw):', reportDate, 'Effective date:', dateToUse);
      
      // Validate dateToUse is present and valid
      if (!dateToUse) {
        console.log('⚠️ No reportDate in URL - starting with empty form');
        setExistingReport(null);
        setFormData(initialFormData);
        setFieldTracking(initialFieldTracking);
        return;
      }
      
      const { supabaseUrl } = getSupabaseConfig();
      const queryUrl = `${supabaseUrl}/rest/v1/daily_reports_v2?client_id=eq.${clientId}&report_date=eq.${dateToUse}`;
      console.log('🔍 Query URL:', queryUrl);
      
      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: getSupabaseHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error fetching existing report:', response.status, errorText);
        setExistingReport(null);
        setFormData(initialFormData);
        setFieldTracking(initialFieldTracking);
        return;
      }
      
      const reports = await response.json();
      console.log('🔍 Existing reports found for date', dateToUse, ':', reports);
      console.log('🔍 All report dates found:', reports.map(r => ({ date: r.report_date, status: r.status })));
      
      if (reports && reports.length > 0) {
        // Find report that matches the exact date from URL (should only be one, but be safe)
        const matchingReport = reports.find(r => {
          const reportDateStr = r.report_date ? r.report_date.split('T')[0].split(' ')[0] : null;
          const urlDateStr = dateToUse;
          const match = reportDateStr === urlDateStr;
          console.log(`🔍 Comparing dates - Report: "${reportDateStr}" === URL: "${urlDateStr}" = ${match}`);
          return match;
        });
        
        if (!matchingReport) {
          console.log('⚠️ No report found with exact date match. URL date:', dateToUse, 'Found dates:', reports.map(r => r.report_date));
          console.log('⚠️ Starting with empty form for new report');
          setExistingReport(null);
          setFormData(initialFormData);
          setFieldTracking(initialFieldTracking);
          return;
        }
        
        const report = matchingReport;
        
        // Normalize report date for comparison
        const normalizedReportDate = report.report_date ? report.report_date.split('T')[0].split(' ')[0] : null;
        
        // Triple-check: only load if report date matches URL date exactly
        if (normalizedReportDate !== dateToUse) {
          console.log('⚠️ Report date mismatch after find! URL date:', dateToUse, 'Report date (normalized):', normalizedReportDate, 'Report date (raw):', report.report_date);
          console.log('⚠️ Not loading this report - dates do not match. Starting with empty form.');
          setExistingReport(null);
          setFormData(initialFormData);
          setFieldTracking(initialFieldTracking);
          return;
        }
        
        // Only set as existing report if it's not a null_report
        // null_reports should not block new report creation
        if (report.status !== 'null_report') {
            console.log('✅ Setting existing report with matching date:', {
              reportDate: report.report_date,
              normalizedReportDate: normalizedReportDate,
              urlDate: dateToUse,
              status: report.status,
              datesMatch: normalizedReportDate === dateToUse
            });
            setExistingReport(report);
            
            // Load form data from existing report
            const loadedFormData = {
            // Morning shift fields
            medication_required: report.medication_required,
            medication_status: report.medication_status || '',
            sleep_woke_on_time: report.sleep_woke_on_time,
            diet_ate_well: report.diet_ate_well,
            dental_hygiene_done: report.dental_hygiene_done,
            routine_made_bed: report.routine_made_bed,
            routine_put_clothes_away: report.routine_put_clothes_away,
            routine_cleared_floor: report.routine_cleared_floor,
            routine_washed_dishes: report.routine_washed_dishes,
            behaviour_observation: report.behaviour_observation || '',
            behaviour_followed_rules: report.behaviour_followed_rules,
            behaviour_listened: report.behaviour_listened,
            behaviour_control: report.behaviour_control,
            
            // Afternoon shift fields
            afternoon_medication_required: report.afternoon_medication_required,
            afternoon_medication_status: report.afternoon_medication_status || '',
            afternoon_slept_on_time: report.afternoon_slept_on_time,
            afternoon_diet_ate_well: report.afternoon_diet_ate_well,
            afternoon_dental_hygiene_done: report.afternoon_dental_hygiene_done,
            afternoon_shower_taken: report.afternoon_shower_taken,
            afternoon_routine_made_bed: report.afternoon_routine_made_bed,
            afternoon_routine_put_clothes_away: report.afternoon_routine_put_clothes_away,
            afternoon_routine_cleared_floor: report.afternoon_routine_cleared_floor,
            afternoon_routine_washed_dishes: report.afternoon_routine_washed_dishes,
            afternoon_school_supposed_to_go: report.afternoon_school_supposed_to_go,
            afternoon_school_status: report.afternoon_school_status || '',
            afternoon_behaviour_observation: report.afternoon_behaviour_observation || '',
            afternoon_behaviour_followed_rules: report.afternoon_behaviour_followed_rules,
            afternoon_behaviour_listened: report.afternoon_behaviour_listened,
            afternoon_behaviour_control: report.afternoon_behaviour_control,
            
            // Evening shift fields
            evening_medication_required: report.evening_medication_required,
            evening_medication_status: report.evening_medication_status || '',
            
            // JSONB fields
            appointments: report.appointments || [],
            bir_incidents: report.bir_incidents || null,
            // Convert old AWOL format to new array format
            awol_incidents: report.awol_incidents || (report.awol_incident ? [{
              id: `awol-${report.report_date}`,
              status: report.awol_status || '',
              remarks: report.awol_remarks || '',
              files: report.awol_files || [],
              updatedBy: report.awol_updated_by,
              updatedAt: report.updated_at || new Date().toISOString()
            }] : []),
            // Convert old Injuries format to new array format
            injuries: report.injuries || (report.injury_occurred ? [{
              id: `injury-${report.report_date}`,
              type: report.injury_type || '',
              perpetrator: report.injury_perpetrator || '',
              remarks: report.injury_remarks || '',
              files: report.injury_files || [],
              updatedBy: report.injury_updated_by,
              updatedAt: report.updated_at || new Date().toISOString()
            }] : [])
            };
            
            setFormData(loadedFormData);
            
            // Load field tracking
            const loadedFieldTracking = {
            // Morning shift tracking
            medication_updated_by: report.medication_updated_by,
            sleep_updated_by: report.sleep_updated_by,
            diet_updated_by: report.diet_updated_by,
            dental_updated_by: report.dental_updated_by,
            routine_made_bed_updated_by: report.routine_made_bed_updated_by,
            routine_put_clothes_away_updated_by: report.routine_put_clothes_away_updated_by,
            routine_cleared_floor_updated_by: report.routine_cleared_floor_updated_by,
            routine_washed_dishes_updated_by: report.routine_washed_dishes_updated_by,
            behaviour_observation_updated_by: report.behaviour_observation_updated_by,
            behaviour_followed_rules_updated_by: report.behaviour_followed_rules_updated_by,
            behaviour_listened_updated_by: report.behaviour_listened_updated_by,
            behaviour_control_updated_by: report.behaviour_control_updated_by,
            
            // Afternoon shift tracking
            afternoon_medication_updated_by: report.afternoon_medication_updated_by,
            afternoon_slept_updated_by: report.afternoon_slept_updated_by,
            afternoon_diet_updated_by: report.afternoon_diet_updated_by,
            afternoon_dental_updated_by: report.afternoon_dental_updated_by,
            afternoon_shower_updated_by: report.afternoon_shower_updated_by,
            afternoon_routine_made_bed_updated_by: report.afternoon_routine_made_bed_updated_by,
            afternoon_routine_put_clothes_away_updated_by: report.afternoon_routine_put_clothes_away_updated_by,
            afternoon_routine_cleared_floor_updated_by: report.afternoon_routine_cleared_floor_updated_by,
            afternoon_routine_washed_dishes_updated_by: report.afternoon_routine_washed_dishes_updated_by,
            afternoon_school_updated_by: report.afternoon_school_updated_by,
            afternoon_behaviour_observation_updated_by: report.afternoon_behaviour_observation_updated_by,
            afternoon_behaviour_followed_rules_updated_by: report.afternoon_behaviour_followed_rules_updated_by,
            afternoon_behaviour_listened_updated_by: report.afternoon_behaviour_listened_updated_by,
            afternoon_behaviour_control_updated_by: report.afternoon_behaviour_control_updated_by,
            
            // Evening shift tracking
            evening_medication_updated_by: report.evening_medication_updated_by,
            appointments_updated_by: report.appointments_updated_by,
            bir_updated_by: report.bir_updated_by,
            awol_updated_by: report.awol_updated_by,
            injury_updated_by: report.injury_updated_by
          };
          
          setFieldTracking(loadedFieldTracking);
        } else {
          // Found null_report - ignore it and allow new report creation
          console.log('🔍 Found null_report, ignoring for form loading');
          setExistingReport(null);
          setFormData(initialFormData);
          setFieldTracking(initialFieldTracking);
        }
      } else {
        // No reports found for this date - start with empty form
        console.log('🔍 No existing reports found for date:', dateToUse);
        setExistingReport(null);
        setFormData(initialFormData);
        setFieldTracking(initialFieldTracking);
      }
    } catch (error) {
      console.error('Error loading existing report:', error);
      setExistingReport(null);
      setFormData(initialFormData);
      setFieldTracking(initialFieldTracking);
    } finally {
      setLoading(false);
    }
  };

  // Mapping from form field names to database tracking field names
  const getTrackingFieldName = (field) => {
    const fieldMapping = {
      // Morning shift fields
      'medication_required': 'medication_updated_by',
      'medication_status': 'medication_updated_by',
      'sleep_woke_on_time': 'sleep_updated_by',
      'diet_ate_well': 'diet_updated_by',
      'dental_hygiene_done': 'dental_updated_by',
      'routine_made_bed': 'routine_made_bed_updated_by',
      'routine_put_clothes_away': 'routine_put_clothes_away_updated_by',
      'routine_cleared_floor': 'routine_cleared_floor_updated_by',
      'routine_washed_dishes': 'routine_washed_dishes_updated_by',
      'behaviour_observation': 'behaviour_observation_updated_by',
      'behaviour_followed_rules': 'behaviour_followed_rules_updated_by',
      'behaviour_listened': 'behaviour_listened_updated_by',
      'behaviour_control': 'behaviour_control_updated_by',
      
      // Afternoon shift fields
      'afternoon_medication_required': 'afternoon_medication_updated_by',
      'afternoon_medication_status': 'afternoon_medication_updated_by',
      'afternoon_slept_on_time': 'afternoon_slept_on_time_updated_by',
      'afternoon_diet_ate_well': 'afternoon_diet_updated_by',
      'afternoon_dental_hygiene_done': 'afternoon_dental_updated_by',
      'afternoon_shower_taken': 'afternoon_shower_updated_by',
      'afternoon_routine_made_bed': 'afternoon_routine_made_bed_updated_by',
      'afternoon_routine_put_clothes_away': 'afternoon_routine_put_clothes_away_updated_by',
      'afternoon_routine_cleared_floor': 'afternoon_routine_cleared_floor_updated_by',
      'afternoon_routine_washed_dishes': 'afternoon_routine_washed_dishes_updated_by',
      'afternoon_school_supposed_to_go': 'afternoon_school_updated_by',
      'afternoon_school_status': 'afternoon_school_updated_by',
      'afternoon_behaviour_observation': 'afternoon_behaviour_observation_updated_by',
      'afternoon_behaviour_followed_rules': 'afternoon_behaviour_followed_rules_updated_by',
      'afternoon_behaviour_listened': 'afternoon_behaviour_listened_updated_by',
      'afternoon_behaviour_control': 'afternoon_behaviour_control_updated_by',
      
      // Evening shift fields
      'evening_medication_required': 'evening_medication_updated_by',
      'evening_medication_status': 'evening_medication_updated_by',
      'appointments': 'appointments_updated_by',
      'bir_incidents': 'bir_updated_by',
      'awol_incidents': 'awol_updated_by',
      'injuries': 'injury_updated_by'
    };
    return fieldMapping[field] || `${field}_updated_by`;
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update field tracking with correct database field name
    const trackingField = getTrackingFieldName(field);
    setFieldTracking(prev => ({
      ...prev,
      [trackingField]: currentUserId
    }));
  };

  // Helper function to check if shift is available based on current time
  // For draft reports, all shifts are available (they're being edited)
  const isShiftAvailable = (shift) => {
    // If it's a draft report, allow editing all shifts
    if (existingReport?.status === 'draft') {
      return true;
    }
    
    // For new reports, check if shift has started
    const now = new Date();
    const currentHour = now.getHours();
    
    if (shift === 'afternoon') {
      return currentHour >= 14; // 2 PM
    } else if (shift === 'evening') {
      return currentHour >= 22; // 10 PM
    }
    return true; // Morning shift always available
  };

  // Helper function to check if evening shift has started (for submit button)
  const isEveningShiftStarted = () => {
    if (isAdmin) return true; // Admins can always submit
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 22; // 10 PM
  };

  // Helper function to check if field can be edited considering shift availability
  const canEditFieldWithShift = (field, shift) => {
    if (isAdmin) return canEditField(field);
    if (!isShiftAvailable(shift)) return false;
    return canEditField(field);
  };

  const canEditField = (field) => {
    // Check if report is locked (for employees only)
    // Only lock if a report already exists (and it's not a null_report) AND the date is locked
    // Draft reports should NOT be locked - only submitted reports
    const hasExistingReport = (existingReport !== null && existingReport?.status !== 'null_report') || (reportId !== null && existingReport?.status !== 'null_report');
    const isDraftReport = existingReport?.status === 'draft';
    if (!isAdmin && hasExistingReport && !isDraftReport && effectiveReportDate && isReportLocked(effectiveReportDate)) {
      return false;
    }
    
    if (isAdmin) return true;
    
    // Appointments, BIR, AWOL, and Injuries are always editable by any employee (unless locked)
    if (field === 'appointments' || field === 'bir_incidents' || 
        field === 'awol_incidents' || field === 'injuries') {
      return true;
    }
    
    const trackingField = getTrackingFieldName(field);
    const updatedBy = fieldTracking[trackingField];
    
    // Can edit if field is empty or user is the one who last updated it
    return !formData[field] || updatedBy === currentUserId;
  };

  const getUserInitials = async (userId) => {
    if (!userId) return '';
    
    try {
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=first_name,last_name`, {
        method: 'GET',
        headers: getSupabaseHeaders()
      });
      
      if (response.ok) {
        const users = await response.json();
        if (users && users.length > 0) {
          const user = users[0];
          return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
        }
      }
    } catch (error) {
      console.error('Error loading user initials:', error);
    }
    
    return '';
  };

  const validateForm = () => {
    const errors = [];
    
    // Morning shift validation
    if (formData.medication_required === null) {
      errors.push('Morning Medication: Please specify if medication is required');
    } else if (formData.medication_required && !formData.medication_status) {
      errors.push('Morning Medication: Please specify medication status');
    }
    
    if (formData.sleep_woke_on_time === null) {
      errors.push('Morning Sleep: Please specify if client woke up on time');
    }
    
    if (formData.diet_ate_well === null) {
      errors.push('Morning Diet: Please specify if client ate well');
    }
    
    if (formData.dental_hygiene_done === null) {
      errors.push('Morning Dental Hygiene: Please specify if dental hygiene was done');
    }
    
    if (formData.routine_made_bed === null) {
      errors.push('Morning Routine: Please specify made bed score');
    }
    
    if (formData.routine_put_clothes_away === null) {
      errors.push('Morning Routine: Please specify put clothes away score');
    }
    
    if (formData.routine_cleared_floor === null) {
      errors.push('Morning Routine: Please specify cleared floor score');
    }
    
    if (formData.routine_washed_dishes === null) {
      errors.push('Morning Routine: Please specify washed dishes score');
    }
    
    if (!formData.behaviour_observation) {
      errors.push('Morning Behaviour: Please specify observation');
    }
    
    if (formData.behaviour_followed_rules === null) {
      errors.push('Morning Behaviour: Please specify if client followed rules');
    }
    
    if (formData.behaviour_listened === null) {
      errors.push('Morning Behaviour: Please specify if client listened to instructions');
    }
    
    if (formData.behaviour_control === null) {
      errors.push('Morning Behaviour: Please specify if client was able to control behaviour');
    }
    
    // Afternoon shift validation
    if (formData.afternoon_medication_required === null) {
      errors.push('Afternoon Medication: Please specify if medication is required');
    } else if (formData.afternoon_medication_required && !formData.afternoon_medication_status) {
      errors.push('Afternoon Medication: Please specify medication status');
    }
    
    if (formData.afternoon_slept_on_time === null) {
      errors.push('Afternoon Sleep: Please specify if client slept on time');
    }
    
    if (formData.afternoon_diet_ate_well === null) {
      errors.push('Afternoon Diet: Please specify if client ate well');
    }
    
    if (formData.afternoon_dental_hygiene_done === null) {
      errors.push('Afternoon Dental Hygiene: Please specify if dental hygiene was done');
    }
    
    if (formData.afternoon_shower_taken === null) {
      errors.push('Afternoon Shower: Please specify if client took a shower');
    }
    
    if (formData.afternoon_routine_made_bed === null) {
      errors.push('Afternoon Routine: Please specify made bed score');
    }
    
    if (formData.afternoon_routine_put_clothes_away === null) {
      errors.push('Afternoon Routine: Please specify put clothes away score');
    }
    
    if (formData.afternoon_routine_cleared_floor === null) {
      errors.push('Afternoon Routine: Please specify cleared floor score');
    }
    
    if (formData.afternoon_routine_washed_dishes === null) {
      errors.push('Afternoon Routine: Please specify washed dishes score');
    }
    
    if (formData.afternoon_school_supposed_to_go === null) {
      errors.push('Afternoon School: Please specify if client was supposed to go to school');
    }
    
    if (formData.afternoon_school_supposed_to_go !== null && !formData.afternoon_school_status) {
      errors.push('Afternoon School: Please specify school status');
    }
    
    if (!formData.afternoon_behaviour_observation) {
      errors.push('Afternoon Behaviour: Please specify observation');
    }
    
    if (formData.afternoon_behaviour_followed_rules === null) {
      errors.push('Afternoon Behaviour: Please specify if client followed rules');
    }
    
    if (formData.afternoon_behaviour_listened === null) {
      errors.push('Afternoon Behaviour: Please specify if client listened to instructions');
    }
    
    if (formData.afternoon_behaviour_control === null) {
      errors.push('Afternoon Behaviour: Please specify if client was able to control behaviour');
    }
    
    // Evening shift validation
    if (formData.evening_medication_required === null) {
      errors.push('Evening Medication: Please specify if medication is required');
    } else if (formData.evening_medication_required && !formData.evening_medication_status) {
      errors.push('Evening Medication: Please specify medication status');
    }
    
    // AWOL and Injuries validation removed - they're now optional arrays
    
    return errors;
  };

  const handleSave = async (status = 'draft', silent = false) => {
    try {
      setSaving(true);
      setError(null);
      
      // Clean form data to satisfy database constraints
      const cleanedFormData = {
        ...formData,
        // Ensure behaviour_observation is either 'positive', 'negative', or null
        behaviour_observation: formData.behaviour_observation === '' ? null : formData.behaviour_observation,
        // Ensure medication_status is not empty string
        medication_status: formData.medication_status === '' ? null : formData.medication_status,
        // Ensure JSONB fields are properly formatted
        appointments: formData.appointments || [],
        bir_incidents: formData.bir_incidents || null,
        awol_incidents: formData.awol_incidents || [],
        injuries: formData.injuries || [],
        // Clean up other fields that might be empty strings
        afternoon_behaviour_observation: formData.afternoon_behaviour_observation === '' ? null : formData.afternoon_behaviour_observation,
        afternoon_medication_status: formData.afternoon_medication_status === '' ? null : formData.afternoon_medication_status,
        evening_medication_status: formData.evening_medication_status === '' ? null : formData.evening_medication_status
      };

      // Ensure facility_id is a valid UUID or null (not the string "null")
      // Use actualFacilityId state which is set when client is loaded
      let finalFacilityId = actualFacilityId || client?.facility_id || null;
      
      // Double-check: if it's still the string "null", set to null
      if (finalFacilityId === 'null' || finalFacilityId === 'undefined') {
        finalFacilityId = null;
      }

      const reportData = {
        client_id: clientId,
        facility_id: finalFacilityId,
        report_date: effectiveReportDate, // Use normalized date
        status: status,
        created_by: currentUserId,
        ...cleanedFormData,
        ...fieldTracking
      };

      // Debug: Log the data being saved
      console.log('🔍 Saving report data:', {
        client_id: reportData.client_id,
        report_date: reportData.report_date,
        status: reportData.status,
        facility_id: reportData.facility_id,
        appointments: reportData.appointments,
        bir_incidents: reportData.bir_incidents,
        formData_appointments: formData.appointments,
        formData_bir_incidents: formData.bir_incidents,
        formData_awol_incidents: formData.awol_incidents,
        formData_injuries: formData.injuries
      });
      console.log('🔍 Report date from URL (raw):', reportDate);
      console.log('🔍 Effective report date (normalized):', effectiveReportDate);
      console.log('🔍 Operational date would be:', getOperationalDate());
      
      
      const { supabaseUrl } = getSupabaseConfig();
      
      if (existingReport) {
        // Update existing report
        const response = await fetch(`${supabaseUrl}/rest/v1/daily_reports_v2?id=eq.${existingReport.id}`, {
          method: 'PATCH',
          headers: {
            ...getSupabaseHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reportData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Supabase error response:', errorText);
          console.error('Request data that failed:', reportData);
          
          // Check for specific database schema errors
          if (errorText.includes('Could not find the') && errorText.includes('column')) {
            throw new Error(`Database schema error: Missing columns detected. Please run the database migration 'add-file-updated-by-columns.sql' in Supabase.`);
          }
          
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
      } else {
        // Create new report
        const response = await fetch(`${supabaseUrl}/rest/v1/daily_reports_v2`, {
          method: 'POST',
          headers: {
            ...getSupabaseHeaders(),
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(reportData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Supabase error response:', errorText);
          console.error('Request data that failed:', reportData);
          
          // Check for specific database schema errors
          if (errorText.includes('Could not find the') && errorText.includes('column')) {
            throw new Error(`Database schema error: Missing columns detected. Please run the database migration 'add-file-updated-by-columns.sql' in Supabase.`);
          }
          
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const newReport = await response.json();
        if (newReport && newReport.length > 0) {
          const savedReport = newReport[0];
          console.log('✅ Report saved successfully:', {
            id: savedReport.id,
            report_date: savedReport.report_date,
            status: savedReport.status,
            client_id: savedReport.client_id
          });
          setExistingReport(savedReport);
        }
      }
      
        if (!silent) {
          // If saving as draft, navigate to dashboard immediately without showing modal
          if (status === 'draft') {
            history.push('/app/dashboard');
          } else {
            // Only show success modal for submitted reports
            setSuccessMessage('Report submitted successfully!');
            setShowSuccessModal(true);
          }
        }
    } catch (error) {
      console.error('Error saving report:', error);
      setError(`Failed to save report: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    // Check if evening shift has started (10 PM) - only for employees
    if (!isAdmin && !isEveningShiftStarted()) {
      setShowSubmitWarningDialog(true);
      return;
    }
    
    const errors = validateForm();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationDialog(true);
      return;
    }
    
    handleSave('submitted');
  };

  const handleDelete = async () => {
    if (!existingReport || !existingReport.id) {
      alert('No report to delete.');
      return;
    }

    try {
      setDeleting(true);
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(
        `${supabaseUrl}/rest/v1/daily_reports_v2?id=eq.${existingReport.id}`,
        {
          method: 'DELETE',
          headers: getSupabaseHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Show success message and redirect to dashboard
      setSuccessMessage('Report deleted successfully.');
      setShowSuccessModal(true);
      setShowDeleteDialog(false);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        history.push('/app/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
      setDeleting(false);
    }
  };

  const handleBack = () => {
    // Navigate back to dashboard or facility page
    if (facilityId && facilityId !== 'null' && facilityId !== 'undefined') {
      history.push(`/app/facility/${facilityId}`);
    } else {
      // Fall back to dashboard if no facility ID
      history.push('/app/dashboard');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress size={24} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading report form...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!client || !facility) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Client or facility not found. Please go back and try again.
        </Alert>
        <Button onClick={handleBack} startIcon={<BackIcon />} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  // Check if report is locked (for employees only)
  // Only lock if a report already exists AND the date is locked
  // Allow creating new reports even after 6:30 AM
  // Only consider it an existing report if it's not a null_report
  // Draft reports should NOT be locked - only submitted reports
  const hasExistingReport = (existingReport !== null && existingReport?.status !== 'null_report') || (reportId !== null && existingReport?.status !== 'null_report');
  const isDraftReport = existingReport?.status === 'draft';
  // Only lock if there's an existing report that is NOT a draft and the date is locked
  const reportLocked = !isAdmin && hasExistingReport && !isDraftReport && effectiveReportDate && isReportLocked(effectiveReportDate);

  if (reportLocked) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          This report is locked. Reports cannot be edited after 6:30 AM.
        </Alert>
        <Button onClick={handleBack} startIcon={<BackIcon />} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button onClick={handleBack} startIcon={<BackIcon />} color="primary">
          Back
        </Button>
        <Typography variant="h4">
          Daily Report Form
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Report saved successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Section 1: Header */}
          <Box sx={{ mb: 4, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
              Daily Report
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Client Name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {client.first_name} {client.last_name}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Room Number
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {client.room || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Facility
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {facility.name}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Report Date
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {effectiveReportDate ? (() => {
                      // Parse date string (YYYY-MM-DD) without timezone conversion
                      const [year, month, day] = effectiveReportDate.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    })() : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Section 2: Morning Shift */}
          <Box sx={{ mt: 4, p: 3, backgroundColor: '#D6EAF8', borderRadius: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a365d' }}>
              Morning Shift (6 AM - 2 PM)
            </Typography>
          
          <Grid container spacing={3}>
            {/* Medication */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Medication
                  </Typography>
                  <FormControl component="fieldset" disabled={!canEditField('medication_required')}>
                    <FormLabel component="legend">Needs to take meds in shift?</FormLabel>
                    <RadioGroup
                      value={formData.medication_required}
                      onChange={(e) => handleFieldChange('medication_required', e.target.value === 'true')}
                    >
                      <FormControlLabel value={true} control={<Radio />} label="Yes - medication needs to be taken" />
                      <FormControlLabel value={false} control={<Radio />} label="No - No medication required" />
                    </RadioGroup>
                  </FormControl>
                  
                  {formData.medication_required && (
                    <FormControl fullWidth sx={{ mt: 2 }} disabled={!canEditField('medication_status')}>
                      <FormLabel>Medication Status</FormLabel>
                      <Select
                        value={formData.medication_status}
                        onChange={(e) => handleFieldChange('medication_status', e.target.value)}
                      >
                        <MenuItem value="Taken">Taken (1pt)</MenuItem>
                        <MenuItem value="Not Taken - AWOL">Not Taken - AWOL (0pt)</MenuItem>
                        <MenuItem value="Not Taken - Refused">Not Taken - Refused (0pt)</MenuItem>
                        <MenuItem value="Not Taken - Home Visit">Not Taken - Home Visit (0pt)</MenuItem>
                        <MenuItem value="Not Taken - Medication Error">Not Taken - Medication Error (0pt)</MenuItem>
                        <MenuItem value="Not Taken - Other">Not Taken - Other (0pt)</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Sleep */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Sleep
                  </Typography>
                  <FormControl component="fieldset" disabled={!canEditField('sleep_woke_on_time')}>
                    <FormLabel component="legend">Woke up in time?</FormLabel>
                    <RadioGroup
                      value={formData.sleep_woke_on_time}
                      onChange={(e) => handleFieldChange('sleep_woke_on_time', e.target.value === 'true')}
                    >
                      <FormControlLabel value={true} control={<Radio />} label="Yes (1pt)" />
                      <FormControlLabel value={false} control={<Radio />} label="No (0pt)" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            {/* Diet */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Diet and Food
                  </Typography>
                  <FormControl component="fieldset" disabled={!canEditField('diet_ate_well')}>
                    <FormLabel component="legend">How was the client's diet/appetite?</FormLabel>
                    <RadioGroup
                      value={formData.diet_ate_well}
                      onChange={(e) => handleFieldChange('diet_ate_well', e.target.value === 'true')}
                    >
                      <FormControlLabel value={true} control={<Radio />} label="Ate breakfast/lunch/brunch well (1pt)" />
                      <FormControlLabel value={false} control={<Radio />} label="Skipped food/Ate poorly (0pt)" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            {/* Dental Hygiene */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Dental Hygiene
                  </Typography>
                  <FormControl component="fieldset" disabled={!canEditField('dental_hygiene_done')}>
                    <FormLabel component="legend">Morning Dental Hygiene done?</FormLabel>
                    <RadioGroup
                      value={formData.dental_hygiene_done}
                      onChange={(e) => handleFieldChange('dental_hygiene_done', e.target.value === 'true')}
                    >
                      <FormControlLabel value={true} control={<Radio />} label="Yes (1pt)" />
                      <FormControlLabel value={false} control={<Radio />} label="No (0pt)" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            {/* Routine Tasks */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Routine Tasks
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { key: 'routine_made_bed', label: 'Made Bed' },
                      { key: 'routine_put_clothes_away', label: 'Put Dirty Clothes Away' },
                      { key: 'routine_cleared_floor', label: 'Cleared Bedroom Floor' },
                      { key: 'routine_washed_dishes', label: 'Washed Dishes' }
                    ].map(({ key, label }) => (
                      <Grid item xs={12} sm={6} key={key}>
                        <FormControl fullWidth disabled={!canEditField(key)}>
                          <FormLabel>{label}</FormLabel>
                          <Select
                            value={formData[key] || ''}
                            onChange={(e) => handleFieldChange(key, parseInt(e.target.value))}
                          >
                            <MenuItem value={5}>5 - Completed independently</MenuItem>
                            <MenuItem value={4}>4 - Completed with assistance</MenuItem>
                            <MenuItem value={3}>3 - Unable to complete</MenuItem>
                            <MenuItem value={2}>2 - Completed but with attitude/difficulty</MenuItem>
                            <MenuItem value={1}>1 - Refused</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Behavioural Questionnaires */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Behavioural Questionnaires
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl component="fieldset" disabled={!canEditField('behaviour_observation')}>
                        <FormLabel component="legend">Observation</FormLabel>
                        <RadioGroup
                          value={formData.behaviour_observation}
                          onChange={(e) => handleFieldChange('behaviour_observation', e.target.value)}
                        >
                          <FormControlLabel value="positive" control={<Radio />} label="Positive (happy, calm, neutral, etc.) - 1pt" />
                          <FormControlLabel value="negative" control={<Radio />} label="Negative (stressed, down, depressed, angry) - 0pt" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl component="fieldset" disabled={!canEditField('behaviour_followed_rules')}>
                        <FormLabel component="legend">Followed Rules</FormLabel>
                        <RadioGroup
                          value={formData.behaviour_followed_rules}
                          onChange={(e) => handleFieldChange('behaviour_followed_rules', e.target.value === 'true')}
                        >
                          <FormControlLabel value={true} control={<Radio />} label="Yes - 1pt" />
                          <FormControlLabel value={false} control={<Radio />} label="No - 0pt" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl component="fieldset" disabled={!canEditField('behaviour_listened')}>
                        <FormLabel component="legend">Listened to Instructions</FormLabel>
                        <RadioGroup
                          value={formData.behaviour_listened}
                          onChange={(e) => handleFieldChange('behaviour_listened', e.target.value === 'true')}
                        >
                          <FormControlLabel value={true} control={<Radio />} label="Yes - 1pt" />
                          <FormControlLabel value={false} control={<Radio />} label="No - 0pt" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl component="fieldset" disabled={!canEditField('behaviour_control')}>
                        <FormLabel component="legend">Able to Control Behaviour</FormLabel>
                        <RadioGroup
                          value={formData.behaviour_control}
                          onChange={(e) => handleFieldChange('behaviour_control', e.target.value === 'true')}
                        >
                          <FormControlLabel value={true} control={<Radio />} label="Yes - 1pt" />
                          <FormControlLabel value={false} control={<Radio />} label="No - 0pt" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          </Box>

          {/* Section 3: Afternoon Shift */}
          <Box sx={{ mt: 4, p: 3, backgroundColor: '#FFE4CC', borderRadius: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#7c2d12' }}>
              Afternoon Shift (2 PM - 10 PM)
            </Typography>
            
            {!isShiftAvailable('afternoon') && !isAdmin && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Afternoon shift becomes available at 2:00 PM
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {/* Afternoon Medication */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Medication (2pm – 10pm)
                    </Typography>
                    <FormControl component="fieldset" disabled={!canEditField('afternoon_medication_required') || (!isShiftAvailable('afternoon') && !isAdmin)}>
                      <FormLabel component="legend">Needs to take meds in shift?</FormLabel>
                      <RadioGroup
                        value={formData.afternoon_medication_required}
                        onChange={(e) => handleFieldChange('afternoon_medication_required', e.target.value === 'true')}
                      >
                        <FormControlLabel value={true} control={<Radio />} label="Yes - medication needs to be taken" />
                        <FormControlLabel value={false} control={<Radio />} label="No - No medication required" />
                      </RadioGroup>
                    </FormControl>
                    
                    {formData.afternoon_medication_required && (
                      <FormControl fullWidth sx={{ mt: 2 }} disabled={!canEditFieldWithShift('afternoon_medication_status', 'afternoon')}>
                        <FormLabel>Medication Status</FormLabel>
                        <Select
                          value={formData.afternoon_medication_status}
                          onChange={(e) => handleFieldChange('afternoon_medication_status', e.target.value)}
                        >
                          <MenuItem value="Taken">Taken (1pt)</MenuItem>
                          <MenuItem value="Not Taken - AWOL">Not Taken - AWOL (0pt)</MenuItem>
                          <MenuItem value="Not Taken - Refused">Not Taken - Refused (0pt)</MenuItem>
                          <MenuItem value="Not Taken - Home Visit">Not Taken - Home Visit (0pt)</MenuItem>
                          <MenuItem value="Not Taken - Medication Error">Not Taken - Medication Error (0pt)</MenuItem>
                          <MenuItem value="Not Taken - Other">Not Taken - Other (0pt)</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Afternoon Sleep */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Sleep
                    </Typography>
                    <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_slept_on_time', 'afternoon')}>
                      <FormLabel component="legend">Slept on time?</FormLabel>
                      <RadioGroup
                        value={formData.afternoon_slept_on_time}
                        onChange={(e) => handleFieldChange('afternoon_slept_on_time', e.target.value === 'true')}
                      >
                        <FormControlLabel value={true} control={<Radio />} label="Yes (1pt)" />
                        <FormControlLabel value={false} control={<Radio />} label="No (0pt)" />
                      </RadioGroup>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Afternoon Diet */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Diet and Food
                    </Typography>
                    <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_diet_ate_well', 'afternoon')}>
                      <FormLabel component="legend">How was the client's diet/appetite?</FormLabel>
                      <RadioGroup
                        value={formData.afternoon_diet_ate_well}
                        onChange={(e) => handleFieldChange('afternoon_diet_ate_well', e.target.value === 'true')}
                      >
                        <FormControlLabel value={true} control={<Radio />} label="Ate well (1pt)" />
                        <FormControlLabel value={false} control={<Radio />} label="Skipped food/Ate poorly (0pt)" />
                      </RadioGroup>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Afternoon Dental Hygiene */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Dental Hygiene
                    </Typography>
                    <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_dental_hygiene_done', 'afternoon')}>
                      <FormLabel component="legend">Evening dental hygiene done?</FormLabel>
                      <RadioGroup
                        value={formData.afternoon_dental_hygiene_done}
                        onChange={(e) => handleFieldChange('afternoon_dental_hygiene_done', e.target.value === 'true')}
                      >
                        <FormControlLabel value={true} control={<Radio />} label="Yes (1pt)" />
                        <FormControlLabel value={false} control={<Radio />} label="No (0pt)" />
                      </RadioGroup>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Shower */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Shower
                    </Typography>
                    <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_shower_taken', 'afternoon')}>
                      <FormLabel component="legend">Took a shower today?</FormLabel>
                      <RadioGroup
                        value={formData.afternoon_shower_taken}
                        onChange={(e) => handleFieldChange('afternoon_shower_taken', e.target.value === 'true')}
                      >
                        <FormControlLabel value={true} control={<Radio />} label="Yes (1pt)" />
                        <FormControlLabel value={false} control={<Radio />} label="No (0pt)" />
                      </RadioGroup>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Afternoon Routine Tasks */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Routine Tasks (4 tasks)
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { key: 'afternoon_routine_made_bed', label: 'Made Bed' },
                        { key: 'afternoon_routine_put_clothes_away', label: 'Put Dirty Clothes Away' },
                        { key: 'afternoon_routine_cleared_floor', label: 'Cleared Bedroom Floor' },
                        { key: 'afternoon_routine_washed_dishes', label: 'Washed Dishes' }
                      ].map(({ key, label }) => (
                        <Grid item xs={12} sm={6} key={key}>
                          <FormControl fullWidth disabled={!canEditFieldWithShift(key, 'afternoon')}>
                            <FormLabel>{label}</FormLabel>
                            <Select
                              value={formData[key] || ''}
                              onChange={(e) => handleFieldChange(key, parseInt(e.target.value))}
                            >
                              <MenuItem value={5}>5 - Completed independently</MenuItem>
                              <MenuItem value={4}>4 - Completed with assistance</MenuItem>
                              <MenuItem value={3}>3 - Unable to complete</MenuItem>
                              <MenuItem value={2}>2 - Completed but with attitude/difficulty</MenuItem>
                              <MenuItem value={1}>1 - Refused</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* School */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      School
                    </Typography>
                    <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_school_supposed_to_go', 'afternoon')}>
                      <FormLabel component="legend">Supposed to go to school today?</FormLabel>
                      <RadioGroup
                        value={formData.afternoon_school_supposed_to_go}
                        onChange={(e) => handleFieldChange('afternoon_school_supposed_to_go', e.target.value === 'true')}
                      >
                        <FormControlLabel value={true} control={<Radio />} label="Yes" />
                        <FormControlLabel value={false} control={<Radio />} label="No" />
                      </RadioGroup>
                    </FormControl>
                    
                    {formData.afternoon_school_supposed_to_go === false && (
                      <FormControl fullWidth sx={{ mt: 2 }} disabled={!canEditFieldWithShift('afternoon_school_status', 'afternoon')}>
                        <FormLabel>Reason</FormLabel>
                        <Select
                          value={formData.afternoon_school_status}
                          onChange={(e) => handleFieldChange('afternoon_school_status', e.target.value)}
                        >
                          <MenuItem value="not enrolled">Not enrolled (1pt)</MenuItem>
                          <MenuItem value="weekend">Weekend (1pt)</MenuItem>
                          <MenuItem value="Holiday/No School">Holiday/No School (1pt)</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                    
                    {formData.afternoon_school_supposed_to_go === true && (
                      <FormControl fullWidth sx={{ mt: 2 }} disabled={!canEditFieldWithShift('afternoon_school_status', 'afternoon')}>
                        <FormLabel>School Status</FormLabel>
                        <Select
                          value={formData.afternoon_school_status}
                          onChange={(e) => handleFieldChange('afternoon_school_status', e.target.value)}
                        >
                          <MenuItem value="Attended">Attended (1pt)</MenuItem>
                          <MenuItem value="Late">Late (1pt)</MenuItem>
                          <MenuItem value="Early Pick Up">Early Pick Up (1pt)</MenuItem>
                          <MenuItem value="Absent">Absent (0pt)</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Afternoon Behavioural Questionnaires */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Behavioural Questionnaires
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_behaviour_observation', 'afternoon')}>
                          <FormLabel component="legend">Observation</FormLabel>
                          <RadioGroup
                            value={formData.afternoon_behaviour_observation}
                            onChange={(e) => handleFieldChange('afternoon_behaviour_observation', e.target.value)}
                          >
                            <FormControlLabel value="negative" control={<Radio />} label="Negative (0pt)" />
                            <FormControlLabel value="positive" control={<Radio />} label="Positive (1pt)" />
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_behaviour_followed_rules', 'afternoon')}>
                          <FormLabel component="legend">Followed Rules</FormLabel>
                          <RadioGroup
                            value={formData.afternoon_behaviour_followed_rules}
                            onChange={(e) => handleFieldChange('afternoon_behaviour_followed_rules', e.target.value === 'true')}
                          >
                            <FormControlLabel value={false} control={<Radio />} label="No (0pt)" />
                            <FormControlLabel value={true} control={<Radio />} label="Yes (1pt)" />
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_behaviour_listened', 'afternoon')}>
                          <FormLabel component="legend">Listened to Instructions</FormLabel>
                          <RadioGroup
                            value={formData.afternoon_behaviour_listened}
                            onChange={(e) => handleFieldChange('afternoon_behaviour_listened', e.target.value === 'true')}
                          >
                            <FormControlLabel value={false} control={<Radio />} label="No (0pt)" />
                            <FormControlLabel value={true} control={<Radio />} label="Yes (1pt)" />
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset" disabled={!canEditFieldWithShift('afternoon_behaviour_control', 'afternoon')}>
                          <FormLabel component="legend">Able to Control Behaviour</FormLabel>
                          <RadioGroup
                            value={formData.afternoon_behaviour_control}
                            onChange={(e) => handleFieldChange('afternoon_behaviour_control', e.target.value === 'true')}
                          >
                            <FormControlLabel value={false} control={<Radio />} label="No (0pt)" />
                            <FormControlLabel value={true} control={<Radio />} label="Yes (1pt)" />
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Section 4: Evening Shift */}
          <Box sx={{ mt: 4, p: 3, backgroundColor: '#E6D7FF', borderRadius: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#553c9a' }}>
              Evening Shift (10 PM - 6 AM)
            </Typography>
            
            {!isShiftAvailable('evening') && !isAdmin && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Evening shift becomes available at 10:00 PM
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {/* Evening Medication */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Medication (10pm – 6am)
                    </Typography>
                    <FormControl component="fieldset" disabled={!canEditFieldWithShift('evening_medication_required', 'evening')}>
                      <FormLabel component="legend">Needs to take meds in shift?</FormLabel>
                      <RadioGroup
                        value={formData.evening_medication_required}
                        onChange={(e) => handleFieldChange('evening_medication_required', e.target.value === 'true')}
                      >
                        <FormControlLabel value={true} control={<Radio />} label="Yes - medication needs to be taken" />
                        <FormControlLabel value={false} control={<Radio />} label="No - No medication required" />
                      </RadioGroup>
                    </FormControl>
                    
                    {formData.evening_medication_required && (
                      <FormControl fullWidth sx={{ mt: 2 }} disabled={!canEditFieldWithShift('evening_medication_status', 'evening')}>
                        <FormLabel>Medication Status</FormLabel>
                        <Select
                          value={formData.evening_medication_status}
                          onChange={(e) => handleFieldChange('evening_medication_status', e.target.value)}
                        >
                          <MenuItem value="Taken">Taken (1pt)</MenuItem>
                          <MenuItem value="Not Taken - AWOL">Not Taken - AWOL (0pt)</MenuItem>
                          <MenuItem value="Not Taken - Refused">Not Taken - Refused (0pt)</MenuItem>
                          <MenuItem value="Not Taken - Home Visit">Not Taken - Home Visit (0pt)</MenuItem>
                          <MenuItem value="Not Taken - Medication Error">Not Taken - Medication Error (0pt)</MenuItem>
                          <MenuItem value="Not Taken - Other">Not Taken - Other (0pt)</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Incident Reports & Appointments Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Incident Reports & Appointments
            </Typography>
            
            <Grid container spacing={3}>
              {/* Appointments */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <AppointmentsManager
                      appointments={formData.appointments || []}
                      onUpdate={(appointments) => handleFieldChange('appointments', appointments)}
                      canEdit={canEditField('appointments')}
                      userId={currentUserId}
                      clientId={clientId}
                      reportDate={effectiveReportDate}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* BIR Report */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <BIRManager
                      birData={formData.bir_incidents || {}}
                      onUpdate={(birData) => handleFieldChange('bir_incidents', birData)}
                      canEdit={canEditField('bir_incidents')}
                      userId={currentUserId}
                      clientId={clientId}
                      reportDate={effectiveReportDate}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* AWOL Report */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <AWOLManager
                      awolIncidents={formData.awol_incidents || []}
                      onUpdate={(awolIncidents) => handleFieldChange('awol_incidents', awolIncidents)}
                      canEdit={canEditField('awol_incidents')}
                      userId={currentUserId}
                      clientId={clientId}
                      reportDate={effectiveReportDate}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Injuries Report */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <InjuriesManager
                      injuries={formData.injuries || []}
                      onUpdate={(injuries) => handleFieldChange('injuries', injuries)}
                      canEdit={canEditField('injuries')}
                      userId={currentUserId}
                      clientId={clientId}
                      reportDate={effectiveReportDate}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>


          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 4 }}>
            {isAdmin && existingReport && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowDeleteDialog(true)}
                disabled={saving || deleting}
                startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              >
                Delete Report
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleSave('draft')}
              disabled={saving || deleting || (!isAdmin && reportLocked)}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              Save & Continue
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={saving || deleting || (!isAdmin && reportLocked) || (!isAdmin && !isEveningShiftStarted())}
              startIcon={saving ? <CircularProgress size={20} /> : <CheckIcon />}
            >
              Submit Report
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Validation Error Dialog */}
      <Dialog open={showValidationDialog} onClose={() => setShowValidationDialog(false)}>
        <DialogTitle>Please Complete Required Fields</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            The following fields must be completed before submitting:
          </Typography>
          <List>
            {validationErrors.map((error, index) => (
              <ListItem key={index}>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowValidationDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Submit Warning Dialog - Show when trying to submit before evening shift */}
      <Dialog open={showSubmitWarningDialog} onClose={() => setShowSubmitWarningDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Report Cannot Be Submitted at This Time
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This report cannot be submitted until the evening shift starts (10:00 PM).
          </Alert>
          <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
            This report cannot be submitted until the evening shift starts (10:00 PM).
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please proceed with completing the remaining reports for your shift.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 'bold' }}>
            Click "Save & Continue" to save your progress and return to the dashboard.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitWarningDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setShowSubmitWarningDialog(false);
              handleSave('draft');
            }} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save & Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onClose={() => setShowSuccessModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <CheckIcon color="success" />
            Success!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {successMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuccessModal(false)} variant="contained" color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog - For Admins Only */}
      {isAdmin && (
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Delete Report
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete this report?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This action cannot be undone. The report and all its data will be permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowDeleteDialog(false)} 
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              variant="contained" 
              color="error"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

export default DailyReportForm;
