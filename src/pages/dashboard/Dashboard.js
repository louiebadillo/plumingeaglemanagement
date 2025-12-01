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
  Tooltip
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
  
  // Employee state
  const [clients, setClients] = useState([]);
  const [clientReports, setClientReports] = useState([]);
  const [previousDayReports, setPreviousDayReports] = useState([]);
  const [previousDayExpanded, setPreviousDayExpanded] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [clientInfoModalOpen, setClientInfoModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  
  // Admin state
  const [unsubmittedReports, setUnsubmittedReports] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = userProfile?.role === 'admin';
  const employeeName = userProfile?.first_name || 'Employee';
  const employeeFacilityId = userProfile?.facility_id;
  // Recalculate operational date on each render to ensure it's current
  const operationalDate = getOperationalDate();

  // TODO: Implement geofencing to detect employee's current facility
  // This will replace the need for facility_id in user profile
  // For now, using facility_id as fallback until geofencing is implemented
  useEffect(() => {
    if (userProfile && !isAdmin) {
      console.log('🔍 Employee Dashboard - User Profile:', {
        id: userProfile.id,
        email: userProfile.email,
        first_name: userProfile.first_name,
        facility_id: userProfile.facility_id, // Temporary fallback until geofencing
        role: userProfile.role
      });
      console.log('📍 Note: Facility will be determined by geofencing in the future');
    }
  }, [userProfile, isAdmin]);

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
  }, [userProfile, isAdmin, operationalDate, location.pathname]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { supabaseUrl } = getSupabaseConfig();

      // Get facility from geofencing (location-based detection)
      // This will automatically detect which facility the employee is currently at
      let currentFacilityId = await getCurrentFacilityFromGeofencing();
      
      // Fallback: If geofencing not implemented or employee not at a facility,
      // use facility_id from user profile (temporary until geofencing is fully implemented)
      if (!currentFacilityId) {
        currentFacilityId = employeeFacilityId;
      }
      
      // If still no facility detected, show message
      if (!currentFacilityId) {
        setError('Unable to detect your current facility. Please ensure you are at a facility location and that geofencing is configured. Facility will be determined by your location when you arrive at a facility.');
        setLoading(false);
        setClients([]);
        setClientReports([]);
        setPreviousDayReports([]);
        return;
      }

      // Load active clients in employee's current facility (determined by geofencing)
      const clientsResponse = await fetch(
        `${supabaseUrl}/rest/v1/clients?facility_id=eq.${currentFacilityId}&status=eq.active&select=*`,
        {
          method: 'GET',
          headers: getSupabaseHeaders()
        }
      );

      if (!clientsResponse.ok) {
        throw new Error(`HTTP error! status: ${clientsResponse.status}`);
      }

      const clientsData = await clientsResponse.json();
      setClients(clientsData || []);

      // Load today's reports for these clients
      if (clientsData && clientsData.length > 0) {
        // Fetch reports for all clients using individual queries (PostgREST doesn't support array in filter easily)
        const clientIds = clientsData.map(c => c.id);
        const allReports = [];
        
        // Fetch reports in parallel for better performance
        const reportPromises = clientIds.map(async (clientId) => {
          try {
            const queryUrl = `${supabaseUrl}/rest/v1/daily_reports_v2?report_date=eq.${operationalDate}&client_id=eq.${clientId}&select=*,clients(first_name,last_name)`;
            
            // Fetch all reports for this client and date, then filter in JavaScript
            const reportResponse = await fetch(queryUrl, {
              method: 'GET',
              headers: getSupabaseHeaders()
            });
            
            if (!reportResponse.ok) {
              const errorText = await reportResponse.text();
              console.error(`Error fetching report for client ${clientId}:`, reportResponse.status, errorText);
              return null;
            }
            
            const reportData = await reportResponse.json();
            
            // Filter out null_reports and prioritize draft reports, then submitted reports
            const validReports = reportData.filter(r => r.status !== 'null_report');
            
            // For employees: only show reports for today's operational date
            // Previous days' reports are automatically filtered out by the date query
            // Admins can see all reports
            let filteredReports = validReports;
            // No additional filtering needed - query already filters by operational date
            
            const draftReport = filteredReports.find(r => r.status === 'draft');
            const submittedReport = filteredReports.find(r => r.status === 'submitted');
            const result = draftReport || submittedReport || null;
            return result;
          } catch (err) {
            console.error(`❌ Error fetching report for client ${clientId}:`, err);
            return null;
          }
        });

        const reportResults = await Promise.all(reportPromises);
        const validReports = reportResults.filter(r => r !== null);
        
        // Additional safeguard: Filter to ensure all reports match the operational date
        // This prevents any reports from other dates from being included
        const normalizeDate = (dateStr) => {
          if (!dateStr) return null;
          return dateStr.split('T')[0].split(' ')[0].trim();
        };
        const normalizedOperationalDate = normalizeDate(operationalDate);
        
        const reportsForOperationalDate = validReports.filter(r => {
          const normalizedReportDate = normalizeDate(r.report_date);
          return normalizedReportDate === normalizedOperationalDate;
        });
        
        setClientReports(reportsForOperationalDate);
        
        // Load previous day's submitted reports
        await loadPreviousDayReports(clientIds);
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
      const { supabaseUrl } = getSupabaseConfig();
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

      // Fetch submitted reports from previous operational day
      const reportPromises = clientIds.map(async (clientId) => {
        try {
          const reportResponse = await fetch(
            `${supabaseUrl}/rest/v1/daily_reports_v2?report_date=eq.${previousOpDateStr}&client_id=eq.${clientId}&status=eq.submitted&select=*,clients(first_name,last_name)`,
            {
              method: 'GET',
              headers: getSupabaseHeaders()
            }
          );
          if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            return reportData && reportData.length > 0 ? reportData[0] : null;
          }
        } catch (err) {
          console.error(`Error fetching previous day report for client ${clientId}:`, err);
        }
        return null;
      });

      const reportResults = await Promise.all(reportPromises);
      const validReports = reportResults.filter(r => r !== null);
      setPreviousDayReports(validReports);
    } catch (err) {
      console.error('Error loading previous day reports:', err);
    }
  };

  const loadUnsubmittedReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const { supabaseUrl } = getSupabaseConfig();

      // Fetch ALL unsubmitted (draft) reports regardless of date or time
      // Same logic as MyReports.js for admins
      const queryUrl = `${supabaseUrl}/rest/v1/daily_reports_v2?status=eq.draft&select=*,clients(first_name,last_name,room,facility_id),facilities(name)&order=report_date.desc,created_at.desc`;

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: getSupabaseHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportsData = await response.json();

      // Fetch editor names for all reports
      const reportsWithEditors = await Promise.all(
        reportsData.map(async (report) => {
          const editorName = await getLastEditor(report);
          return { ...report, lastEditorName: editorName };
        })
      );

      setUnsubmittedReports(reportsWithEditors || []);
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
    const normalizeDate = (dateStr) => {
      if (!dateStr) return null;
      return dateStr.split('T')[0].split(' ')[0].trim();
    };
    
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
    const normalizeDate = (dateStr) => {
      if (!dateStr) return null;
      return dateStr.split('T')[0].split(' ')[0].trim();
    };
    
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

  const getLastEditor = async (report) => {
    // Get the most recent updated_by from any tracking field
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
    let lastUpdateTime = new Date(report.created_at);

    trackingFields.forEach(field => {
      const updatedBy = report[field];
      if (updatedBy) {
        // Use the most recent one (we'll use created_at as proxy since we don't have timestamps per field)
        lastEditorId = updatedBy;
      }
    });

    // Fetch user name
    if (lastEditorId) {
      try {
        const { supabaseUrl } = getSupabaseConfig();
        const response = await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${lastEditorId}&select=first_name,last_name`,
          {
            method: 'GET',
            headers: getSupabaseHeaders()
          }
        );

        if (response.ok) {
          const users = await response.json();
          if (users && users.length > 0) {
            const user = users[0];
            return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
          }
        }
      } catch (err) {
        console.error('Error fetching last editor:', err);
      }
    }

    return 'Unknown';
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
            <Typography variant="h5" gutterBottom>
              Daily Reports 
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              View and manage all in-progress reports across all facilities and dates. Yellow indicates reports for today, red indicates past due reports.
            </Typography>
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
                    {unsubmittedReports.map((report) => {
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
          <Typography variant="h5" gutterBottom>
            Your Clients for Today
            </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
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
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{ 
                                cursor: 'pointer',
                                color: 'primary.main',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                              onClick={() => handleViewClient(client.id)}
                            >
                              {client.first_name} {client.last_name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Age: {calculateAge(client.date_of_birth)} • Room: {client.room || 'N/A'}
                            </Typography>
                          </Box>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {client.first_name?.[0]}{client.last_name?.[0]}
                          </Avatar>
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
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
                          />
                          <Box>
                            {status === 'not_started' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CreateIcon />}
                                onClick={() => handleCreateReport(client)}
                              >
                                Start
                              </Button>
                            )}
                            {status === 'in_progress' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditReport(client)}
                                sx={{
                                  backgroundColor: '#FFC107', // Yellow
                                  color: '#000000', // Black text
                                  '&:hover': {
                                    backgroundColor: '#FFB300', // Slightly darker yellow on hover
                                  }
                                }}
                              >
                                Continue
                              </Button>
                            )}
                            {/* No button for completed/submitted status - only show chip */}
                          </Box>
          </Box>
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
