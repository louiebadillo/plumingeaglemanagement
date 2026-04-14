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
import { getCurrentFacilityFromGeofencing, clearGeofencingCache } from '../../utils/geofencing';
import {
  resolveEmployeeDashboardFacilityId,
  FACILITY_RESOLUTION,
} from '../../utils/employeeFacility';
import { supabase } from '../../lib/supabase';
import { getOperationalDate } from '../../utils/dateHelpers';


function MyReports() {
  const history = useHistory();
  const { supabase, userProfile } = useSupabase();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFacilityId, setCurrentFacilityId] = useState(null);
  const [facilityResolutionSource, setFacilityResolutionSource] = useState(null);

  const isAdmin = userProfile?.role === 'admin';

  // Load reports: admins see all drafts; employees only when inside a facility geofence (no profile fallback)
  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isAdmin) {
          const { data, error: qError } = await supabase
            .from('daily_reports_v2')
            .select(`
              *,
              clients(first_name, last_name, room, facility_id),
              facilities(name)
            `)
            .eq('status', 'draft')
            .order('report_date', { ascending: false })
            .order('created_at', { ascending: false });

          if (cancelled) return;
          if (qError) {
            throw new Error(`Failed to fetch reports: ${qError.message}`);
          }
          setCurrentFacilityId(null);
          setFacilityResolutionSource(null);
          setReports(data || []);
          return;
        }

        clearGeofencingCache();
        const geofenceFacilityId = await getCurrentFacilityFromGeofencing();
        const { facilityId, source } = await resolveEmployeeDashboardFacilityId({
          supabase,
          userId: userProfile.id,
          geofenceFacilityId,
          profileFacilityId: userProfile.facility_id,
        });
        if (cancelled) return;
        setCurrentFacilityId(facilityId);
        setFacilityResolutionSource(source);

        if (!facilityId) {
          setReports([]);
          return;
        }

        const operationalDate = getOperationalDate();
        const { data, error: qError } = await supabase
          .from('daily_reports_v2')
          .select(`
            *,
            clients(first_name, last_name, room, facility_id),
            facilities(name)
          `)
          .eq('status', 'draft')
          .eq('facility_id', facilityId)
          .eq('report_date', operationalDate)
          .order('report_date', { ascending: false });

        if (cancelled) return;
        if (qError) {
          throw new Error(`Failed to fetch reports: ${qError.message}`);
        }

        const filtered = (data || []).filter((report) => {
          const clientFacilityId = report.clients?.facility_id;
          const reportDate = report.report_date?.split('T')[0];
          return clientFacilityId === facilityId && reportDate === operationalDate;
        });
        setReports(filtered);
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching reports:', err);
          setError('Failed to load reports.');
          setReports([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userProfile, isAdmin, supabase]);

  const draftReports = reports;

  const handleViewEditReport = (report) => {
    const clientName = `${report.clients?.first_name || ''}-${report.clients?.last_name || ''}`.toLowerCase();
    
    const facilityId = report.facility_id || report.clients?.facility_id;
    
    if (!facilityId) {
      console.error('❌ Cannot edit report: no facility_id available', report);
      alert('Cannot edit this report: Facility information is missing. Please contact an administrator.');
      return;
    }
    
    const returnTo = encodeURIComponent('/app/reports/my-reports');
    const url = `/app/reports/daily-report?reportId=${report.id}&clientId=${report.client_id}&facility=${facilityId}&date=${report.report_date}&returnTo=${returnTo}`;
    console.log('🔍 Navigating to:', url, 'Report data:', report, 'Using facilityId:', facilityId);
    history.push(url);
  };

  const handleCreateNewReport = () => {
    history.push('/app/facility');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('T')[0].split('-');
      if (!year || !month || !day) return dateString;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
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

  const getReportStatus = (report) => {
    if (report.status !== 'draft') {
      return { label: 'Submitted', color: 'success', icon: <ReportIcon /> };
    }
    
    const operationalDate = getOperationalDate();
    const reportDate = report.report_date?.split('T')[0];
    
    if (reportDate === operationalDate) {
      return { label: 'In Progress', color: 'warning', icon: <SaveIcon /> };
    }
    return { label: 'Past Due', color: 'error', icon: <SaveIcon /> };
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
        {isAdmin ? 'All In-Progress Reports' : 'In-Progress Reports for Today'}
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        {isAdmin 
          ? 'View and manage all in-progress reports across all facilities and dates. Yellow indicates reports for today, red indicates past due reports.'
          : currentFacilityId
            ? facilityResolutionSource === FACILITY_RESOLUTION.GEOFENCE
              ? 'Continue editing in-progress reports for clients at your current facility (detected by geofence). Evening shift staff should complete and submit before end of shift.'
              : 'Continue editing in-progress reports for clients at your assigned facility. Allow location on-site for automatic site detection by geofence.'
            : 'You need a facility assignment and/or to be inside a facility geofence to see in-progress reports for that site.'}
      </Typography>
      
      {!isAdmin && !currentFacilityId && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No facility could be determined. Ask an administrator to set your facility assignment, or open this page on-site, allow location access, and ensure geofencing is configured for the building.
        </Alert>
      )}
      {!isAdmin && currentFacilityId && facilityResolutionSource && facilityResolutionSource !== FACILITY_RESOLUTION.GEOFENCE && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {facilityResolutionSource === FACILITY_RESOLUTION.USER_FACILITIES_MULTI
            ? 'Multiple facilities are assigned; showing drafts for the first assigned site until location selects a site via geofence.'
            : 'Using your assigned facility because location did not resolve a geofence.'}
        </Alert>
      )}

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
                    ? 'There are no in-progress reports for clients in your current facility. Create a new report from the dashboard to get started.'
                    : 'Reports for today will appear when you have a facility assignment and/or are on-site inside a geofence.'}
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
