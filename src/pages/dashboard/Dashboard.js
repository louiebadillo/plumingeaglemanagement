import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack
} from '@mui/material';
import {
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  Assignment as ReportIcon
} from '@mui/icons-material';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';
import { getProfilePhotoUrl } from '../../utils/fileUpload';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../../context/SupabaseContext';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';
import { getOperationalDate, isReportLocked, calculateAge } from '../../utils/dateHelpers';
import { getCurrentFacilityFromGeofencing } from '../../utils/geofencing';
import DateSelectionModal from '../../components/DailyReport/DateSelectionModal';
import ClientInfoModal from '../../components/Client/ClientInfoModal';
import UserSwitcher from '../../components/UserSwitcher/UserSwitcher';

function Dashboard() {
  const history = useHistory();
  const location = useLocation();
  const { userProfile, supabase } = useSupabase();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Helper function to format date string (YYYY-MM-DD) without timezone conversion
  const formatDateString = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Parse date string (YYYY-MM-DD) without timezone conversion
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) return dateString; // Fallback if format is unexpected
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString; // Fallback to original string
    }
  };
  
  // Shared helper function to normalize date strings (extracted to avoid duplication)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    return dateStr.split('T')[0].split(' ')[0].trim();
  };
  
  // Employee state
  const [clients, setClients] = useState([]);
  const [clientReports, setClientReports] = useState([]);
  const [previousDayReports, setPreviousDayReports] = useState([]);
  const [previousDayExpanded, setPreviousDayExpanded] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [clientInfoModalOpen, setClientInfoModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientPhotoUrls, setClientPhotoUrls] = useState({});
  
  // Admin state
  const [unsubmittedReports, setUnsubmittedReports] = useState([]);
  const [allUnsubmittedReports, setAllUnsubmittedReports] = useState([]); // Store all reports before filtering
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentFacility, setCurrentFacility] = useState(null); // Store facility name and address
  const [facilityFilter, setFacilityFilter] = useState('all'); // Facility filter for admin dashboard
  const [facilities, setFacilities] = useState([]); // All facilities for filter dropdown
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isAdmin = userProfile?.role === 'admin';
  const employeeName = userProfile?.first_name || 'Employee';
  const employeeFacilityId = userProfile?.facility_id;
  // Recalculate operational date on each render to ensure it's current
  const operationalDate = getOperationalDate();

  // TODO: Implement geofencing to detect employee's current facility
  // This will replace the need for facility_id in user profile
  // For now, using facility_id as fallback until geofencing is implemented

  // Load facilities for admin filter
  useEffect(() => {
    if (isAdmin && userProfile) {
      const loadFacilities = async () => {
        try {
          const { data: facilitiesData, error } = await supabase
            .from('facilities')
            .select('id, name')
            .order('name', { ascending: true });
          
          if (error) {
            console.error('Error loading facilities:', error);
          } else {
            setFacilities(facilitiesData || []);
          }
        } catch (error) {
          console.error('Error loading facilities:', error);
        }
      };
      
      loadFacilities();
    }
  }, [isAdmin, userProfile, supabase]);

  // Load data based on user role
  // Also reload when location changes (user navigates back to dashboard)
  useEffect(() => {
    if (userProfile) {
      if (isAdmin) {
        loadUnsubmittedReports();
      } else {
        loadEmployeeData();
      }
    }
  }, [userProfile, isAdmin, operationalDate, location.pathname, facilityFilter]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ PERFORMANCE: Get facility from geofencing (cached for 5 minutes)
      // This will automatically detect which facility the employee is currently at
      let currentFacilityId = await getCurrentFacilityFromGeofencing();
      console.log('📍 Geofencing detected facility:', currentFacilityId);
      
      // Fallback: If geofencing not implemented or employee not at a facility,
      // use facility_id from user profile (temporary until geofencing is fully implemented)
      if (!currentFacilityId) {
        console.log('📍 No facility from geofencing, using employee profile facility_id:', employeeFacilityId);
        currentFacilityId = employeeFacilityId;
      }
      
      console.log('📍 Final facility ID to use:', currentFacilityId);
      
      // ✅ PERFORMANCE: Parallelize independent queries
      // Load clients and facility info in parallel (they don't depend on each other)
      let clientsData = null;
      let facilityData = null;
      
      if (currentFacilityId) {
        // Parallel queries: clients and facility info
        const [clientsResult, facilityResult] = await Promise.all([
          // Load clients in employee's current facility
          supabase
            .from('clients')
            .select('*')
            .eq('facility_id', currentFacilityId)
            .limit(100),
          // Load facility information for display
          supabase
            .from('facilities')
            .select('id, name, address')
            .eq('id', currentFacilityId)
            .maybeSingle()
        ]);
        
        const { data, error: clientsError } = clientsResult;
        const { data: facilityInfo, error: facilityError } = facilityResult;
        
        console.log('🔍 Client query result:', {
          facilityId: currentFacilityId,
          dataLength: data?.length || 0,
          data: data,
          error: clientsError
        });
        
        if (clientsError) {
          console.error('❌ Error loading clients:', clientsError);
          // Check if it's an RLS error
          if (clientsError.code === '42501' || clientsError.message?.includes('row-level security')) {
            throw new Error('Access denied. You may not have permission to view clients in this facility. Please contact an administrator.');
          }
          throw new Error(`Failed to load clients: ${clientsError.message}`);
        }
        
        console.log('✅ Clients loaded:', data?.length || 0, 'clients found for facility', currentFacilityId);
        clientsData = data;
        
        // ✅ CRITICAL: Set clients state immediately so they appear in UI
        setClients(data || []);
        console.log('✅ Clients state updated:', (data || []).length, 'clients');
        
        if (facilityError) {
          if (facilityError.code === '42501' || facilityError.message?.includes('row-level security')) {
            console.error('RLS policy blocking: Employee does not have permission to read from facilities table');
          }
          setCurrentFacility(null);
        } else if (facilityInfo) {
          setCurrentFacility(facilityInfo);
        } else {
          setCurrentFacility(null);
        }
      } else {
        // If no facility detected, try to load all active clients as fallback
        const { data, error: allClientsError } = await supabase
          .from('clients')
          .select('*')
          .limit(100);
        
        if (allClientsError) {
          console.error('❌ Error loading all clients:', allClientsError);
          const errorMsg = 'Unable to detect your current facility and failed to load clients. Please ensure you are at a facility location and that geofencing is configured. If you continue to see this message, contact an administrator.';
          setError(errorMsg);
          setLoading(false);
          setClients([]);
          setClientReports([]);
          setPreviousDayReports([]);
          return;
        }
        
        clientsData = data;
        // ✅ CRITICAL: Set clients state for fallback case too
        setClients(data || []);
        console.log('✅ Fallback clients state set:', (data || []).length, 'clients');
      }

      // Photo loading is now done in parallel with reports (see below)
      
      // ✅ CRITICAL: Set clients state FIRST before processing reports/photos
      // This ensures clients appear in UI immediately, even if reports/photos are still loading
      console.log('🔧 Setting clients state BEFORE reports/photos processing:', (clientsData || []).length);
      setClients(clientsData || []);
      
      // ✅ PERFORMANCE: Load reports and photos in parallel (they're independent)
      // Employees can see/create/edit daily reports for clients in their facility for TODAY only
      const clientsToProcess = clientsData || [];
      if (clientsToProcess && clientsToProcess.length > 0) {
        const clientIds = clientsData.map(c => c.id);
        
        // Ensure clientIds is not empty (edge case protection)
        if (!clientIds || clientIds.length === 0) {
          setClientReports([]);
          setClientPhotoUrls({});
          // Clients already set above, just return
          setLoading(false);
          return;
        }
        
        // ✅ PERFORMANCE: Parallelize photo loading and report loading
        const [reportsResult, photoResults] = await Promise.all([
          // Load today's reports for these clients
          (async () => {
            try {
              const { data: allReports, error: reportsError } = await supabase
                .from('daily_reports_v2')
                .select('*, clients(first_name, last_name)')
                .eq('report_date', operationalDate)
                .in('client_id', clientIds)
                .order('created_at', { ascending: false });
            
              if (reportsError) {
                console.error('Error fetching reports:', reportsError);
                return [];
              }
              
              // Filter out null_report status in JavaScript
              const validReports = (allReports || []).filter(report => report.status !== 'null_report');
              
              // Process results: Group by client_id and find draft or submitted report for each
              const reportsByClient = {};
              validReports.forEach(report => {
                if (!reportsByClient[report.client_id]) {
                  reportsByClient[report.client_id] = [];
                }
                reportsByClient[report.client_id].push(report);
              });
              
              // For each client, find draft report (priority) or submitted report
              const reportResults = clientIds.map(clientId => {
                const clientReports = reportsByClient[clientId] || [];
                const draftReport = clientReports.find(r => r.status === 'draft');
                const submittedReport = clientReports.find(r => r.status === 'submitted');
                return draftReport || submittedReport || null;
              }).filter(r => r !== null);
              
              // Additional safeguard: Filter to ensure all reports match the operational date
              const normalizedOperationalDate = normalizeDate(operationalDate);
              
              return reportResults.filter(r => {
                const normalizedReportDate = normalizeDate(r.report_date);
                return normalizedReportDate === normalizedOperationalDate;
              });
            } catch (err) {
              console.error('Error fetching reports:', err);
              return [];
            }
          })(),
          // Load signed URLs for profile photos (in parallel with reports)
          (async () => {
            if (!clientsData || clientsData.length === 0) return {};
            
            const photoUrlPromises = clientsData
              .filter(client => client.profile_photo_url)
              .map(async (client) => {
                try {
                  const signedUrl = await getProfilePhotoUrl(client.profile_photo_url, 3600);
                  return { clientId: client.id, url: signedUrl };
                } catch (error) {
                  console.error(`Error loading photo for client ${client.id}:`, error);
                  return null;
                }
              });
            
            const results = await Promise.all(photoUrlPromises);
            const photoUrlMap = {};
            results.forEach(result => {
              if (result) {
                photoUrlMap[result.clientId] = result.url;
              }
            });
            return photoUrlMap;
          })()
        ]);
        
        setClientReports(reportsResult);
        setClientPhotoUrls(photoResults);
        
        // Load previous day's submitted reports (can be done after main data loads)
        loadPreviousDayReports(clientIds).catch(err => {
          console.error('Error loading previous day reports:', err);
        });
      } else {
        setClientReports([]);
        setClientPhotoUrls({});
      }
      
      // ✅ CRITICAL: Always set clients state at the end (ensures they appear in UI)
      // This is a safety check to ensure clients are set even if something went wrong earlier
      if (clientsData) {
        console.log('✅ Final setClients call - clientsData:', clientsData.length, 'clients');
        setClients(clientsData);
      } else {
        console.log('⚠️ No clientsData to set');
        setClients([]);
      }
    } catch (err) {
      console.error('Error loading employee data:', err);
      setError('Failed to load client data.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousDayReports = async (clientIds) => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calculate previous operational date
      const previousOpDate = new Date();
      if (currentHour < 6) {
        // If before 6 AM, previous day is 2 days ago
        previousOpDate.setDate(previousOpDate.getDate() - 2);
      } else {
        // If after 6 AM, previous day is yesterday
        previousOpDate.setDate(previousOpDate.getDate() - 1);
      }
      const previousOpDateStr = previousOpDate.toISOString().split('T')[0];

      // ✅ FIX #1: Single query for all previous day reports (instead of N+1 queries)
      // ✅ FIX #3: Query optimized to use idx_reports_status_date index
      // Edge case: Handle empty clientIds array
      if (!clientIds || clientIds.length === 0) {
        setPreviousDayReports([]);
        return;
      }
      
      const { data: previousReports, error: prevReportsError } = await supabase
        .from('daily_reports_v2')
        .select('*, clients(first_name, last_name)')
        .eq('report_date', previousOpDateStr)
        .eq('status', 'submitted')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false }); // For consistency

      if (prevReportsError) {
        console.error('Error fetching previous day reports:', prevReportsError);
        setPreviousDayReports([]);
      } else {
        setPreviousDayReports(previousReports || []);
      }
    } catch (err) {
      console.error('Error loading previous day reports:', err);
      setPreviousDayReports([]);
    }
  };

  const loadUnsubmittedReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
      // Fetch ALL unsubmitted (draft) reports regardless of date or time
      const { data: reportsData, error: reportsError } = await supabase
        .from('daily_reports_v2')
        .select(`
          *,
          clients(first_name, last_name, room, facility_id),
          facilities(name)
        `)
        .eq('status', 'draft')
        .order('report_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (reportsError) {
        throw new Error(`Failed to load reports: ${reportsError.message}`);
      }

      // ✅ PERFORMANCE: Batch fetch editor names (avoid N+1 queries)
      // Collect all unique editor IDs first
      const editorIds = new Set();
      reportsData.forEach(report => {
        const editorId = getLastEditorId(report);
        if (editorId) {
          editorIds.add(editorId);
        }
      });
      
      // Batch fetch all editor names in one query
      const editorNamesMap = {};
      if (editorIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', Array.from(editorIds));
        
        if (!usersError && usersData) {
          usersData.forEach(user => {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            editorNamesMap[user.id] = fullName || 'Unknown';
          });
        }
      }
      
      // Map editor names to reports
      const reportsWithEditors = reportsData.map(report => {
        const editorId = getLastEditorId(report);
        const editorName = editorId ? (editorNamesMap[editorId] || 'Unknown') : 'Unknown';
        return { ...report, lastEditorName: editorName };
      });

      const allReports = reportsWithEditors || [];
      setAllUnsubmittedReports(allReports);
      
      // Apply facility filter
      let filteredReports = allReports;
      if (facilityFilter !== 'all') {
        filteredReports = allReports.filter(report => {
          const reportFacilityId = report.facility_id || report.clients?.facility_id;
          return String(reportFacilityId) === String(facilityFilter);
        });
      }
      
      setUnsubmittedReports(filteredReports);
      // Reset to page 1 when filter changes
      setCurrentPage(1);
    } catch (err) {
      console.error('Error loading unsubmitted reports:', err);
      setError('Failed to load unsubmitted reports.');
    } finally {
      setLoading(false);
    }
  };

  // Determine if report is "In Progress" (today's operational date) or "Past Due" (past operational date)
  const getReportStatusIndicator = (reportDateString) => {
    const operationalDate = getOperationalDate();
    const reportDate = reportDateString?.split('T')[0]; // Normalize date format
    
    if (reportDate === operationalDate) {
      // In Progress - today's operational date
      return { label: 'In Progress', color: 'warning', icon: <SaveIcon /> };
    } else {
      // Past Due - from past operational dates
      return { label: 'Past Due', color: 'error', icon: <SaveIcon /> };
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportStatus = (clientId) => {
    // Normalize dates for comparison (remove any time components)
    const normalizedOperationalDate = normalizeDate(operationalDate);
    
    // Find report that matches BOTH client_id AND operational date
    // Only reports for today's operational date should be in clientReports
    const report = clientReports.find(r => {
      const normalizedReportDate = normalizeDate(r.report_date);
      return r.client_id === clientId && normalizedReportDate === normalizedOperationalDate;
    });
    
    if (!report) return 'not_started';
    
    // Double-check: Ensure report is for today's operational date
    const normalizedReportDate = normalizeDate(report.report_date);
    if (normalizedReportDate !== normalizedOperationalDate) {
      return 'not_started';
    }
    
    // Return status based on report status
    if (report.status === 'submitted') return 'completed';
    if (report.status === 'draft') return 'in_progress';
    return 'not_started';
  };

  const getReportForClient = (clientId) => {
    // Normalize dates for comparison (remove any time components)
    const normalizedOperationalDate = normalizeDate(operationalDate);
    
    // Find report that matches BOTH client_id AND operational date
    // Only reports for today's operational date should be in clientReports
    const report = clientReports.find(r => {
      const normalizedReportDate = normalizeDate(r.report_date);
      return r.client_id === clientId && normalizedReportDate === normalizedOperationalDate;
    });
    
    if (!report) return null;
    
    // Double-check: Ensure report is for today's operational date
    const normalizedReportDate = normalizeDate(report.report_date);
    if (normalizedReportDate !== normalizedOperationalDate) {
      return null;
    }
    
    // Return report (employees only see reports for today's operational date)
    return report;
  };

  const handleCreateReport = (client) => {
    // Show modal for both employees and admins
    // Employees will see questionnaire without date picker
    // Admins will see questionnaire with date picker
    setSelectedClient(client);
    setReportModalOpen(true);
  };

  const handleEditReport = (client) => {
    const report = getReportForClient(client.id);
    if (report) {
      history.push(
        `/app/reports/daily-report?clientId=${client.id}&date=${operationalDate}&facility=${employeeFacilityId}&edit=true&reportId=${report.id}`
      );
    }
  };

  const handleViewClient = (clientId) => {
    setSelectedClientId(clientId);
    setClientInfoModalOpen(true);
  };

  const handleAdminViewReport = (report) => {
    history.push(
      `/app/reports/daily-report?clientId=${report.client_id}&date=${report.report_date}&facility=${report.facility_id}&edit=true&reportId=${report.id}`
    );
  };

  const handleAdminDeleteReport = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      setSubmitting(true);
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(
        `${supabaseUrl}/rest/v1/daily_reports_v2?id=eq.${reportToDelete.id}`,
        {
          method: 'DELETE',
          headers: getSupabaseHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reload reports
      await loadUnsubmittedReports();
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Failed to delete report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSubmitReport = async (report) => {
    try {
      setSubmitting(true);
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(
        `${supabaseUrl}/rest/v1/daily_reports_v2?id=eq.${report.id}`,
        {
          method: 'PATCH',
          headers: {
            ...getSupabaseHeaders(),
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            status: 'submitted',
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reload reports
      await loadUnsubmittedReports();
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ PERFORMANCE: Extract editor ID without fetching (for batch processing)
  const getLastEditorId = (report) => {
    const trackingFields = [
      'medication_updated_by',
      'sleep_updated_by',
      'diet_updated_by',
      'dental_updated_by',
      'routine_made_bed_updated_by',
      'routine_put_clothes_away_updated_by',
      'routine_cleared_floor_updated_by',
      'routine_washed_dishes_updated_by',
      'behaviour_observation_updated_by',
      'behaviour_followed_rules_updated_by',
      'behaviour_listened_updated_by',
      'behaviour_control_updated_by',
      'afternoon_medication_updated_by',
      'afternoon_slept_on_time_updated_by',
      'afternoon_diet_updated_by',
      'afternoon_dental_updated_by',
      'afternoon_shower_updated_by',
      'afternoon_routine_made_bed_updated_by',
      'afternoon_routine_put_clothes_away_updated_by',
      'afternoon_routine_cleared_floor_updated_by',
      'afternoon_routine_washed_dishes_updated_by',
      'afternoon_school_updated_by',
      'afternoon_behaviour_observation_updated_by',
      'afternoon_behaviour_followed_rules_updated_by',
      'afternoon_behaviour_listened_updated_by',
      'afternoon_behaviour_control_updated_by',
      'evening_medication_updated_by',
      'appointments_updated_by',
      'bir_updated_by',
      'awol_updated_by',
      'injury_updated_by'
    ];

    // Find the most recent updated_by
    let lastEditorId = report.created_by; // Default to creator

    trackingFields.forEach(field => {
      const updatedBy = report[field];
      if (updatedBy) {
        lastEditorId = updatedBy;
      }
    });

    return lastEditorId;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
  return (
      <Box sx={{ p: 3 }}>
        {/* Development Role Switcher */}
      {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <UserSwitcher />
          </Box>
        )}
        {/* Welcome Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Welcome, Admin
            </Typography>
          </CardContent>
        </Card>

        {/* In-Progress Reports Section */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  Daily Reports 
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  View and manage all in-progress reports across all facilities and dates. Yellow indicates reports for today, red indicates past due reports.
                </Typography>
              </Box>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Facility</InputLabel>
                <Select
                  value={facilityFilter}
                  label="Filter by Facility"
                  onChange={(e) => {
                    setFacilityFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page when filter changes
                  }}
                >
                  <MenuItem value="all">All Facilities</MenuItem>
                  {facilities.map((facility) => (
                    <MenuItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>Loading reports...</Typography>
              </Box>
            ) : unsubmittedReports.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No In-Progress Reports
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  There are no draft reports across all facilities.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Client Name</strong></TableCell>
                      <TableCell><strong>Facility</strong></TableCell>
                      <TableCell><strong>Report Date</strong></TableCell>
                      <TableCell><strong>Last Saved</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unsubmittedReports
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((report) => {
                      const statusIndicator = getReportStatusIndicator(report.report_date);
                      return (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {report.clients?.first_name} {report.clients?.last_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Room {report.clients?.room || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{report.facilities?.name || 'N/A'}</TableCell>
                          <TableCell>{formatDateString(report.report_date)}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDateTime(report.updated_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                  <Chip 
                              icon={statusIndicator.icon}
                              label={statusIndicator.label}
                              color={statusIndicator.color}
                    size="small"
                  />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View/Edit Report">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleAdminViewReport(report)}
                                  disabled={submitting}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Report">
                                <IconButton
                    size="small"
                                  color="error"
                                  onClick={() => handleAdminDeleteReport(report)}
                                  disabled={submitting}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Submit Report">
                                <IconButton
                    size="small"
                                  color="success"
                                  onClick={() => handleAdminSubmitReport(report)}
                                  disabled={submitting}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination */}
                {unsubmittedReports.length > itemsPerPage && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Typography variant="body2" color="textSecondary">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, unsubmittedReports.length)} of {unsubmittedReports.length} reports
                    </Typography>
                    <Pagination
                      count={Math.ceil(unsubmittedReports.length / itemsPerPage)}
                      page={currentPage}
                      onChange={(event, value) => setCurrentPage(value)}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Per Page</InputLabel>
                      <Select
                        value={itemsPerPage}
                        label="Per Page"
                        onChange={(e) => {
                          setItemsPerPage(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Report</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this report? This action cannot be undone.
            </Typography>
            {reportToDelete && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Client:</strong> {reportToDelete.clients?.first_name} {reportToDelete.clients?.last_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Report Date:</strong> {formatDateString(reportToDelete.report_date)}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteReport}
              color="error"
              variant="contained"
              disabled={submitting}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
              </Box>
    );
  }

  // Employee Dashboard
  return (
    <Box sx={{ p: 3 }}>
      {/* Development Role Switcher */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <UserSwitcher />
        </Box>
      )}
      {/* Section 1: Welcome & Navbar Legend */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Welcome, {employeeName}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
              Quick Guide
            </Typography>
            
            <Box sx={{ ml: 1, mb: 3 }}>
              <Typography variant="body1" paragraph sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>Daily Reports:</strong> Create and fill out daily reports for your clients. These reports are shared, so you and your coworkers will be filling out <strong>1 report per client per day</strong>.
                      </Typography>
              
              <Typography variant="body1" paragraph sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>Editing Rules:</strong> Any inputs you make can only be edited by yourself. Other staff members can only edit empty fields or fields they've previously filled.
                      </Typography>
              
              <Typography variant="body1" paragraph sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>File Uploads:</strong> Upload individual reports for Appointments, BIRs, AWOL incidents, and Injury reports in the bottom section of the report in their corresponding upload fields.
              </Typography>
              
              <Box sx={{ mt: 2.5, p: 2, backgroundColor: '#fff9e6', borderRadius: 1, borderLeft: '4px solid #FFC107' }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#856404' }}>
                  ⏱️ Time Estimate
            </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#856404' }}>
                  <strong>~5 minutes</strong> - Fill out a quick questionnaire for your shift only. Evening shift staff should submit the reports before the end of their shift (before 6:00 AM).
            </Typography>
                </Box>
              </Box>
              
          </Box>
        </CardContent>
      </Card>

      {/* Section 2: Client List with Report Status */}
      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Your Clients for Today
            </Typography>
            {currentFacility && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {currentFacility.name}
                </Typography>
                {currentFacility.address && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {currentFacility.address}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {(() => {
            console.log('🔍 UI Render - clients state:', {
              clientsLength: clients.length,
              clients: clients,
              loading: loading
            });
            return null;
          })()}
          {clients.length === 0 ? (
            <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
              No active clients found in your facility.
            </Typography>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {clients.map((client) => {
                const status = getReportStatus(client.id);

                return (
                  <Grid item xs={12} sm={6} md={4} key={client.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: '100%', sm: 100 },
                          minWidth: { sm: 100 },
                          minHeight: { xs: 112, sm: 160 },
                          alignSelf: { sm: 'stretch' },
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {clientPhotoUrls[client.id] ? (
                          <Box
                            component="img"
                            src={clientPhotoUrls[client.id]}
                            alt={`${client.first_name} ${client.last_name}`}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center'
                            }}
                          />
                        ) : (
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              color: 'white', 
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}
                          >
                            {client.first_name?.[0]}{client.last_name?.[0]}
                          </Typography>
                        )}
                      </Box>
                      <CardContent
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          '&:last-child': { pb: 2 }
                        }}
                      >
                        <Box mb={1}>
                          <Typography
                            variant="h6"
                            sx={{
                              cursor: 'pointer',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' },
                              mb: 0.5,
                              wordBreak: 'break-word'
                            }}
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setClientInfoModalOpen(true);
                            }}
                          >
                            {client.first_name} {client.last_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Age: {calculateAge(client.date_of_birth)} • Room:{' '}
                            {client.room || 'N/A'}
                          </Typography>
                        </Box>

                        <Stack spacing={1.5} sx={{ width: '100%', mt: 'auto', pt: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              flexWrap: 'wrap',
                              gap: 0.5
                            }}
                          >
                            <Chip
                              label={
                                status === 'completed'
                                  ? 'Submitted'
                                  : status === 'in_progress'
                                    ? 'In Progress'
                                    : 'Not Started'
                              }
                              color={
                                status === 'completed'
                                  ? 'success'
                                  : status === 'in_progress'
                                    ? 'warning'
                                    : 'default'
                              }
                              size="small"
                              sx={{ maxWidth: '100%' }}
                            />
                          </Box>
                          <Box sx={{ width: '100%' }}>
                            {status === 'not_started' && (
                              <Button
                                fullWidth
                                size="medium"
                                variant="contained"
                                startIcon={<CreateIcon />}
                                onClick={() => handleCreateReport(client)}
                              >
                                Start report
                              </Button>
                            )}
                            {status === 'in_progress' && (
                              <Button
                                fullWidth
                                size="medium"
                                variant="contained"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditReport(client)}
                                sx={{
                                  backgroundColor: '#FFC107',
                                  color: '#000000',
                                  '&:hover': {
                                    backgroundColor: '#FFB300'
                                  }
                                }}
                              >
                                Continue report
                              </Button>
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
    </Grid>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Previous Day Reports */}
      {previousDayReports.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Accordion expanded={previousDayExpanded} onChange={() => setPreviousDayExpanded(!previousDayExpanded)}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="previous-day-reports-content"
                id="previous-day-reports-header"
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <HistoryIcon color="primary" />
                  <Typography variant="h6">
                    Previous Day Reports ({previousDayReports.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Submitted reports from the previous operational day
                </Typography>
                <Grid container spacing={2}>
                  {previousDayReports.map((report) => (
                    <Grid item xs={12} sm={6} md={4} key={report.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {report.clients?.first_name} {report.clients?.last_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Date: {formatDateString(report.report_date)}
                          </Typography>
                          <Chip
                            label="Submitted"
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Date Selection Modal */}
      <DateSelectionModal
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        facilityId={employeeFacilityId || selectedClient?.facility_id || null}
      />

      {/* Client Info Modal */}
      <ClientInfoModal
        open={clientInfoModalOpen}
        onClose={() => {
          setClientInfoModalOpen(false);
          setSelectedClientId(null);
        }}
        clientId={selectedClientId}
      />
    </Box>
  );
}

export default Dashboard;
