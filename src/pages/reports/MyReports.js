import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon,
  Assignment as ReportIcon,
  Save as SaveIcon,
  AccessTime as DraftIcon
} from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import { getCurrentFacilityFromGeofencing } from '../../utils/geofencing';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';
import { getOperationalDate } from '../../utils/dateHelpers';


function MyReports() {
  const history = useHistory();
  const { supabase, userProfile } = useSupabase();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFacilityId, setCurrentFacilityId] = useState(null);

  const currentUserId = userProfile?.id;
  const isAdmin = userProfile?.role === 'admin';
  const employeeFacilityId = userProfile?.facility_id; // Fallback facility from user profile

  // Get current facility from geofencing (for employees)
  useEffect(() => {
    const detectFacility = async () => {
      if (isAdmin || !userProfile) {
        setCurrentFacilityId(null);
        return;
      }

      try {
        // Get facility from geofencing (location-based detection)
        let facilityId = await getCurrentFacilityFromGeofencing();
        
        // Fallback: If geofencing not implemented or employee not at a facility,
        // use facility_id from user profile (temporary until geofencing is fully implemented)
        if (!facilityId) {
          facilityId = employeeFacilityId;
        }
        
        setCurrentFacilityId(facilityId);
        
        if (!facilityId) {
          console.warn('📍 No facility detected for employee');
        } else {
          console.log('📍 MyReports - Detected facility:', facilityId);
        }
      } catch (err) {
        console.error('Error detecting facility:', err);
        // Fallback to user profile facility
        setCurrentFacilityId(employeeFacilityId);
      }
    };

    detectFacility();
  }, [userProfile, isAdmin, employeeFacilityId]);

  // Fetch reports based on facility (for employees) or all reports (for admins)
  useEffect(() => {
    const fetchReports = async () => {
      if (!userProfile) return;
      
      // For employees, wait for facility detection
      if (!isAdmin && !currentFacilityId) {
        return; // Wait for facility to be detected
      }

      setLoading(true);
      setError(null);
      try {
        const { supabaseUrl } = getSupabaseConfig();
        
        // Get the current operational date (6 AM - 6 AM logic)
        const operationalDate = getOperationalDate();
        
        // Build query URL
        // For employees: filter by facility_id (geofenced facility) and operational date
        // For admins: Show ALL draft reports (no date or facility filter)
        let queryUrl;
        if (!isAdmin && currentFacilityId) {
          // Employee view: Filter by facility_id and operational date to show only today's in-progress reports for clients in the geofenced facility
          queryUrl = `${supabaseUrl}/rest/v1/daily_reports_v2?status=eq.draft&facility_id=eq.${currentFacilityId}&report_date=eq.${operationalDate}&select=*,clients(first_name,last_name,room,facility_id),facilities(name)&order=report_date.desc`;
        } else {
          // Admin view: Show ALL draft reports across all dates and facilities
          queryUrl = `${supabaseUrl}/rest/v1/daily_reports_v2?status=eq.draft&select=*,clients(first_name,last_name,room,facility_id),facilities(name)&order=report_date.desc,created_at.desc`;
        }

        const response = await fetch(queryUrl, {
          method: 'GET',
          headers: getSupabaseHeaders()
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔍 MyReports fetched data:', data);
        console.log('🔍 Operational date filter:', operationalDate);
        
        // For employees: Additional filter to ensure only clients in the geofenced facility are shown
        // Also ensure report_date matches operational date (double-check)
        // For admins: No filtering - show all draft reports
        let filteredData = data || [];
        if (!isAdmin && currentFacilityId) {
          filteredData = filteredData.filter(report => {
            // Filter by client's facility_id to ensure only clients in the detected facility
            const clientFacilityId = report.clients?.facility_id;
            // Also ensure report_date matches operational date
            const reportDate = report.report_date?.split('T')[0]; // Normalize date format
            return clientFacilityId === currentFacilityId && reportDate === operationalDate;
          });
        }
        // For admins: No filtering needed - show all draft reports
        
        setReports(filteredData);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [userProfile, isAdmin, currentFacilityId]);

  // Show all draft reports without filtering
  const draftReports = reports;

  const handleViewEditReport = (report) => {
    const clientName = `${report.clients?.first_name || ''}-${report.clients?.last_name || ''}`.toLowerCase();
    
    // Use facility_id from report, or fallback to client's facility_id
    const facilityId = report.facility_id || report.clients?.facility_id;
    
    if (!facilityId) {
      console.error('❌ Cannot edit report: no facility_id available', report);
      alert('Cannot edit this report: Facility information is missing. Please contact an administrator.');
      return;
    }
    
    const url = `/app/reports/daily-report?reportId=${report.id}&clientId=${report.client_id}&facility=${facilityId}&date=${report.report_date}`;
    console.log('🔍 Navigating to:', url, 'Report data:', report, 'Using facilityId:', facilityId);
    history.push(url);
  };

  const handleCreateNewReport = () => {
    history.push('/app/facility');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Parse date string (YYYY-MM-DD) without timezone conversion
      const [year, month, day] = dateString.split('T')[0].split('-');
      if (!year || !month || !day) return dateString; // Fallback if format is unexpected
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString; // Fallback to original string
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

  // Determine if report is "In Progress" (today's operational date) or "Past Due" (past operational date)
  const getReportStatus = (report) => {
    if (report.status !== 'draft') {
      return { label: 'Submitted', color: 'success', icon: <ReportIcon /> };
    }
    
    const operationalDate = getOperationalDate();
    const reportDate = report.report_date?.split('T')[0]; // Normalize date format
    
    if (reportDate === operationalDate) {
      // In Progress - today's operational date
      return { label: 'In Progress', color: 'warning', icon: <SaveIcon /> };
    } else {
      // Past Due - from past operational dates
      return { label: 'Past Due', color: 'error', icon: <SaveIcon /> };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'warning';
      case 'submitted': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <SaveIcon />;
      default: return <ReportIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading your reports...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isAdmin ? 'All In-Progress Reports' : 'In-Progress Reports'}
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        {isAdmin 
          ? 'View and manage all in-progress reports across all facilities and dates. Yellow indicates reports for today, red indicates past due reports.'
          : currentFacilityId
            ? 'Continue editing in-progress reports for clients in your current facility. Submit them when complete.'
            : 'Loading facility information...'}
      </Typography>
      
      {!isAdmin && !currentFacilityId && !loading && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Unable to detect your current facility. Please ensure you are at a facility location and that geofencing is configured. 
          Reports will be shown once your facility is detected.
        </Alert>
      )}

      {/* Create New Report Button - Only for employees */}
      {!isAdmin && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateNewReport}
            startIcon={<ReportIcon />}
          >
            Create New Report
          </Button>
        </Box>
      )}

      {/* Draft Reports Table */}
      <Card>
        <CardContent>
          {draftReports.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client Name</TableCell>
                    <TableCell>Facility</TableCell>
                    <TableCell>Report Date</TableCell>
                    <TableCell>Last Saved</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draftReports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {report.clients?.first_name} {report.clients?.last_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Room {report.clients?.room}
                        </Typography>
                      </TableCell>
                      <TableCell>{report.facilities?.name}</TableCell>
                      <TableCell>{formatDate(report.report_date)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(report.updated_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Chip
                            icon={getReportStatus(report).icon}
                            label={getReportStatus(report).label}
                            color={getReportStatus(report).color}
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={getStatusIcon(report.status)}
                            label={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            color={getStatusColor(report.status)}
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Continue Editing">
                          <IconButton
                            size="small"
                            onClick={() => handleViewEditReport(report)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <DraftIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No In-Progress Reports
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {isAdmin 
                  ? 'There are no draft reports across all facilities.'
                  : currentFacilityId
                    ? 'There are no in-progress reports for clients in your current facility. Create a new report to get started.'
                    : 'No reports available.'}
              </Typography>
              {!isAdmin && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateNewReport}
                  startIcon={<ReportIcon />}
                >
                  Create New Report
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default MyReports;