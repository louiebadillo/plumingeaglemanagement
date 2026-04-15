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
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';
import ReportViewer from '../../components/Reports/ReportViewer';

function AdminReports() {
  const history = useHistory();
  const { userProfile } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [error, setError] = useState(null);

  const userRole = userProfile?.role || 'employee';
  const isAdmin = userRole === 'admin';
  const queryClient = useQueryClient();

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

  // ✅ FIX #4: Cached reports query - 1 minute TTL (reports change frequently)
  // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
  const { data: reportsData, isLoading: reportsLoading, error: reportsError, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports', 'submitted'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_reports_v2')
        .select(`
          *,
          clients(first_name, last_name, room),
          facilities(name)
        `)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        throw new Error(`Failed to fetch reports: ${error.message}`);
      }

      const reports = data || [];
      // Batch fetch "submitted by" names from public.users (avoid N+1)
      const editorIds = Array.from(
        reports.reduce((acc, r) => {
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

      return reports.map((r) => {
        const editorId = getLastEditorId(r);
        return {
          ...r,
          submittedByName: editorId ? (editorNamesMap[editorId] || 'Unknown') : 'Unknown',
        };
      });
    },
    enabled: isAdmin, // Only fetch if admin
    staleTime: 1 * 60 * 1000, // Cache for 1 minute (reports change frequently)
    onError: (error) => {
      console.error('Error loading reports:', error);
      setError('Failed to load reports');
    },
  });

  // ✅ FIX #4: Cached clients query - 5 minute TTL
  // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'dropdown'], // Separate cache key for dropdown
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .limit(100);
      
      if (error) {
        throw new Error(`Failed to fetch clients: ${error.message}`);
      }
      
      return data || [];
    },
    enabled: isAdmin, // Only fetch if admin
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // ✅ FIX #4: Cached facilities query - 30 minute TTL (uses same cache as Layout)
  // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
  const { data: facilitiesData } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch facilities: ${error.message}`);
      }
      
      return data || [];
    },
    enabled: isAdmin, // Only fetch if admin
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes (facilities rarely change)
  });

  const reports = reportsData || [];
  const clients = clientsData || [];
  const facilities = facilitiesData || [];
  const loading = reportsLoading;

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm || 
      `${report.clients?.first_name} ${report.clients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.clients?.room?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesFacility = facilityFilter === 'all' || report.facility_id === facilityFilter;
    const matchesClient = clientFilter === 'all' || report.client_id === clientFilter;
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const reportDate = new Date(report.report_date);
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          matchesDate = reportDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = reportDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = reportDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesFacility && matchesClient && matchesDate;
  });

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowDetailsDialog(true);
  };

  const handleViewSummary = (reportId) => {
    setSelectedReportId(reportId);
    setShowReportViewer(true);
  };

  const handleEditReport = (report) => {
    const returnTo = encodeURIComponent('/app/reports/admin-reports');
    history.push(`/app/reports/daily-report?clientId=${report.client_id}&date=${report.report_date}&facility=${report.facility_id}&edit=true&returnTo=${returnTo}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'success';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress size={24} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading reports...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Submitted Reports
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            refetchReports();
            queryClient.invalidateQueries(['clients', 'dropdown']);
            queryClient.invalidateQueries(['facilities']);
          }}
        >
          Refresh
        </Button>
      </Box>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        View and manage all submitted daily reports from staff for all clients across all facilities.
      </Typography>

      {(error || reportsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || reportsError?.message || 'Failed to load reports'}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by client name or room"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Facility</InputLabel>
                <Select
                  value={facilityFilter}
                  onChange={(e) => setFacilityFilter(e.target.value)}
                  label="Facility"
                >
                  <MenuItem value="all">All Facilities</MenuItem>
                  {facilities.map(facility => (
                    <MenuItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  label="Client"
                >
                  <MenuItem value="all">All Clients</MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Reports Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Facility</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Submitted by</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {report.clients?.first_name} {report.clients?.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{report.clients?.room || 'N/A'}</TableCell>
                      <TableCell>{report.facilities?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={report.status}
                          color={getStatusColor(report.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(report.created_at)}</TableCell>
                      <TableCell>{report.submittedByName || 'Unknown'}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Summary">
                            <IconButton
                              size="small"
                              onClick={() => handleViewSummary(report.id)}
                              color="info"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Report">
                            <IconButton
                              size="small"
                              onClick={() => handleEditReport(report)}
                              color="secondary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No reports found matching your criteria.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Report Details - {selectedReport?.clients?.first_name} {selectedReport?.clients?.last_name}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Report Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Date:</Typography>
                  <Typography variant="body1">{formatDate(selectedReport.report_date)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status:</Typography>
                  <Chip
                    label={selectedReport.status}
                    color={getStatusColor(selectedReport.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Room:</Typography>
                  <Typography variant="body1">{selectedReport.clients?.room || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Facility:</Typography>
                  <Typography variant="body1">{selectedReport.facilities?.name || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Morning Shift Responses
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Medication Required:</Typography>
                  <Typography variant="body1">
                    {selectedReport.medication_required === null ? 'Not specified' : 
                     selectedReport.medication_required ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Medication Status:</Typography>
                  <Typography variant="body1">{selectedReport.medication_status || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Woke on Time:</Typography>
                  <Typography variant="body1">
                    {selectedReport.sleep_woke_on_time === null ? 'Not specified' : 
                     selectedReport.sleep_woke_on_time ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Ate Well:</Typography>
                  <Typography variant="body1">
                    {selectedReport.diet_ate_well === null ? 'Not specified' : 
                     selectedReport.diet_ate_well ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Dental Hygiene:</Typography>
                  <Typography variant="body1">
                    {selectedReport.dental_hygiene_done === null ? 'Not specified' : 
                     selectedReport.dental_hygiene_done ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Behaviour Observation:</Typography>
                  <Typography variant="body1">{selectedReport.behaviour_observation || 'Not specified'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Routine Tasks
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Made Bed:</Typography>
                  <Typography variant="body1">{selectedReport.routine_made_bed || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Put Clothes Away:</Typography>
                  <Typography variant="body1">{selectedReport.routine_put_clothes_away || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Cleared Floor:</Typography>
                  <Typography variant="body1">{selectedReport.routine_cleared_floor || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Washed Dishes:</Typography>
                  <Typography variant="body1">{selectedReport.routine_washed_dishes || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowDetailsDialog(false);
              handleEditReport(selectedReport);
            }}
          >
            Edit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Summary Viewer */}
      <ReportViewer
        reportId={selectedReportId}
        open={showReportViewer}
        onClose={() => {
          setShowReportViewer(false);
          setSelectedReportId(null);
        }}
      />
    </Box>
  );
}

export default AdminReports;
