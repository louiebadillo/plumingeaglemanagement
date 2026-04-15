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
  Delete as DeleteIcon,
  Assignment as ReportIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as DraftIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import { getCurrentFacilityFromGeofencing, clearGeofencingCache } from '../../utils/geofencing';
import { supabase } from '../../lib/supabase';
import { getOperationalDate } from '../../utils/dateHelpers';


function MyReports() {
  const history = useHistory();
  const { supabase, userProfile } = useSupabase();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFacilityId, setCurrentFacilityId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  const getLastEditorId = (report) => {
    if (!report) return null;
    const trackingFields = [
      'morning_client_in_facility_updated_by',
      'afternoon_client_in_facility_updated_by',
      'evening_client_in_facility_updated_by',
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
      'injury_updated_by',
    ];

    let lastEditorId = report.created_by || null;
    trackingFields.forEach((field) => {
      const updatedBy = report[field];
      if (updatedBy) lastEditorId = updatedBy;
    });
    return lastEditorId;
  };

  const attachLastEditorNames = async (rows) => {
    const reportsData = rows || [];
    const editorIds = Array.from(
      reportsData.reduce((acc, r) => {
        const id = getLastEditorId(r);
        if (id) acc.add(id);
        return acc;
      }, new Set())
    );

    let editorNamesMap = {};
    if (editorIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', editorIds);
      if (!usersError && usersData) {
        editorNamesMap = usersData.reduce((acc, u) => {
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          acc[u.id] = fullName || 'Unknown';
          return acc;
        }, {});
      }
    }

    return reportsData.map((r) => {
      const editorId = getLastEditorId(r);
      return {
        ...r,
        lastEditorName: editorId ? (editorNamesMap[editorId] || 'Unknown') : 'Unknown',
      };
    });
  };

  // Load reports: admins see all drafts; employees only when inside a facility geofence (no profile fallback)
  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async (opts = {}) => {
      const { isManual = false } = opts;
      if (isManual) setIsRefreshing(true);
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
          const withEditors = await attachLastEditorNames(data || []);
          if (cancelled) return;
          setReports(withEditors);
          return;
        }

        clearGeofencingCache();
        const facilityId = await getCurrentFacilityFromGeofencing();
        if (cancelled) return;
        setCurrentFacilityId(facilityId);

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
          setIsRefreshing(false);
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

  const refreshAdminDraftReports = async () => {
    setError(null);
    setIsRefreshing(true);
    setLoading(true);
    try {
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
      if (qError) throw new Error(`Failed to fetch reports: ${qError.message}`);
      const withEditors = await attachLastEditorNames(data || []);
      setReports(withEditors);
    } catch (err) {
      console.error('Error refreshing reports:', err);
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAdminDeleteReport = async (report) => {
    if (!report?.id) return;
    const ok = window.confirm('Delete this draft report? This cannot be undone.');
    if (!ok) return;
    try {
      setIsMutating(true);
      const { error: delError } = await supabase
        .from('daily_reports_v2')
        .delete()
        .eq('id', report.id);
      if (delError) throw new Error(delError.message);
      await refreshAdminDraftReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      setError(`Failed to delete report: ${err.message}`);
    } finally {
      setIsMutating(false);
    }
  };

  const handleAdminSubmitReport = async (report) => {
    if (!report?.id) return;
    const ok = window.confirm('Submit this report? It will move out of drafts.');
    if (!ok) return;
    try {
      setIsMutating(true);
      const { data: updatedRows, error: updError } = await supabase
        .from('daily_reports_v2')
        .update({ status: 'submitted', updated_at: new Date().toISOString() })
        .eq('id', report.id)
        .select('id,status');
      if (updError) throw new Error(updError.message);
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Submit was blocked (no rows updated). Check RLS policies for status transitions.');
      }
      await refreshAdminDraftReports();
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(`Failed to submit report: ${err.message}`);
    } finally {
      setIsMutating(false);
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {isAdmin ? 'All In-Progress Reports' : 'In-Progress Reports for Today'}
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={async () => {
              await refreshAdminDraftReports();
            }}
            disabled={loading || isRefreshing || isMutating}
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            Refresh
          </Button>
        )}
      </Box>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        {isAdmin 
          ? 'View and manage all in-progress reports across all facilities and dates. Yellow indicates reports for today, red indicates past due reports.'
          : currentFacilityId
            ? 'Continue editing in-progress reports for clients at your current facility (detected by geofence). Evening shift staff should complete and submit before end of shift.'
            : 'You must be inside a facility geofence to see in-progress reports for that site.'}
      </Typography>
      
      {!isAdmin && !currentFacilityId && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No facility detected from your location. Open this page on a facility device on-site, allow location access, and ensure geofencing is configured for the building.
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
                    {isAdmin && <TableCell>Last updated by</TableCell>}
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
                      {isAdmin && (
                        <TableCell>
                          <Typography variant="body2">
                            {report.lastEditorName || 'Unknown'}
                          </Typography>
                        </TableCell>
                      )}
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
                        <Box display="flex" gap={1}>
                          <Tooltip title="View/Edit Report">
                            <IconButton
                              size="small"
                              onClick={() => handleViewEditReport(report)}
                              color="primary"
                              disabled={isMutating}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && (
                            <>
                              <Tooltip title="Delete Report">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAdminDeleteReport(report)}
                                  color="error"
                                  disabled={isMutating}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Submit Report">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAdminSubmitReport(report)}
                                  color="success"
                                  disabled={isMutating}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
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
                    : 'Reports for today will appear here when you are on-site inside a facility geofence.'}
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
