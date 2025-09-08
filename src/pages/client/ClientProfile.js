import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Restaurant as RestaurantIcon,
  Sports as SportsIcon,
  Notes as NotesIcon,
  ContactEmergency as EmergencyIcon,
  CalendarToday as CalendarIcon,
  Room as RoomIcon,
  PhotoCamera as PhotoCameraIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useParams, useHistory } from 'react-router-dom';
import { getClientById, formatDate, calculateAge } from '../../context/clientMock';
import { getCurrentUserRole } from '../../components/Sidebar/getSidebarStructure';
import { 
  getReportsByClientId, 
  processChartData, 
  getAverageByMetric, 
  getTrend,
  availableMetrics 
} from '../../context/dailyReportsMock';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import html2canvas from 'html2canvas';

function ClientProfile() {
  const { clientId } = useParams();
  const history = useHistory();
  const urlParams = new URLSearchParams(window.location.search);
  const facilityFromUrl = urlParams.get('facility');
  const [client, setClient] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('mood');
  const [dateRange, setDateRange] = useState('monthly');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [chartRefs, setChartRefs] = useState({});
  const [clientReports, setClientReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  
  const userRole = getCurrentUserRole();
  const isAdmin = userRole === 'admin';
  const isNewClient = clientId === 'new';

  // Load reports when client or date range changes
  useEffect(() => {
    const loadReports = async () => {
      if (!client || isNewClient) {
        setClientReports([]);
        return;
      }
      
      setReportsLoading(true);
      try {
        let reports = await getReportsByClientId(client.id);
        
        if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          reports = reports.filter(report => 
            report.date >= customDateRange.startDate && 
            report.date <= customDateRange.endDate
          );
        } else if (dateRange === 'monthly') {
          // Last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
          reports = reports.filter(report => report.date >= thirtyDaysAgoStr);
        } else if (dateRange === 'yearly') {
          // Last 365 days
          const oneYearAgo = new Date();
          oneYearAgo.setDate(oneYearAgo.getDate() - 365);
          const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
          reports = reports.filter(report => report.date >= oneYearAgoStr);
        }
        // 'all' shows all data, no filtering needed
        
        setClientReports(reports);
      } catch (error) {
        console.error('Error loading reports:', error);
        setClientReports([]);
      } finally {
        setReportsLoading(false);
      }
    };

    loadReports();
  }, [client, dateRange, customDateRange, isNewClient]);

  // Calculate analytics data from loaded reports
  const chartData = clientReports.length > 0 ? processChartData(clientReports, selectedMetric) : [];
  const averageScore = clientReports.length > 0 ? getAverageByMetric(clientReports, selectedMetric) : 0;
  const trend = clientReports.length > 0 ? getTrend(clientReports, selectedMetric) : 'stable';

  // Smart date formatting based on data range
  const getDateFormatter = (data) => {
    if (data.length === 0) return (value) => new Date(value).toLocaleDateString();
    
    const dates = data.map(d => new Date(d.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 7) {
      // Week or less: show day and month
      return (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (daysDiff <= 31) {
      // Month or less: show month and day
      return (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (daysDiff <= 365) {
      // Year or less: show month and year
      return (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } else {
      // More than a year: show month and year
      return (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  const getTickCount = (data) => {
    if (data.length === 0) return 5;
    if (data.length <= 7) return data.length;
    if (data.length <= 31) return Math.min(8, data.length);
    return Math.min(12, Math.ceil(data.length / 3));
  };

  // Handle date range changes
  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
    
    if (newDateRange === 'custom') {
      // Set default custom range to last 30 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      setCustomDateRange({
        startDate: startDateStr,
        endDate: endDate
      });
    }
  };

  useEffect(() => {
    if (isNewClient) {
      // Initialize empty client for new client creation
      const newClient = {
        id: null,
        firstName: '',
        lastName: '',
        age: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        facility: facilityFromUrl || 'facility-a', // Use facility from URL or default
        room: '',
        admissionDate: new Date().toISOString().split('T')[0], // Today's date
        status: 'Active',
        profilePhoto: null,
        dietaryRestrictions: [],
        activityPreferences: [],
        otherPreferences: [],
        medicalNotes: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        secondaryEmergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        assignedStaff: [],
        lastUpdated: new Date().toISOString()
      };
      setClient(newClient);
      setEditingClient(newClient);
      setEditDialogOpen(true); // Open edit dialog immediately for new client
    } else {
      const clientData = getClientById(clientId);
      if (clientData) {
        setClient(clientData);
        setEditingClient(clientData);
      } else {
        // Redirect to facility page if client not found
        history.push('/app/facility/facility-a');
      }
    }
  }, [clientId, history, isNewClient]);

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    // In a real app, this would update the database
    console.log('Saving client:', editingClient);
    
    if (isNewClient) {
      // For new clients, generate a temporary ID and redirect to the client profile
      const newClientWithId = {
        ...editingClient,
        id: Date.now(), // Temporary ID until SQLite setup
        lastUpdated: new Date().toISOString()
      };
      setClient(newClientWithId);
      setEditDialogOpen(false);
      // Redirect to the new client's profile page
      history.push(`/app/client/${newClientWithId.id}`);
      alert('New client created successfully!');
    } else {
      // For existing clients, just update the data
      setClient(editingClient);
      setEditDialogOpen(false);
      alert('Client information updated successfully!');
    }
  };

  const handleConfirmDelete = () => {
    // In a real app, this would delete from database
    console.log('Deleting client:', client.id);
    setDeleteDialogOpen(false);
    // Redirect back to facility
    history.push(`/app/facility/${client.facility}`);
    // Show success message
    alert('Client deleted successfully!');
  };

  const handleInputChange = (field, value) => {
    setEditingClient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setEditingClient(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handleSecondaryEmergencyContactChange = (field, value) => {
    setEditingClient(prev => ({
      ...prev,
      secondaryEmergencyContact: {
        ...prev.secondaryEmergencyContact,
        [field]: value
      }
    }));
  };

  const handleExportChart = async () => {
    if (clientReports.length === 0) {
      alert('No data available to export');
      return;
    }

    try {
      if (selectedMetric === 'all') {
        // Export all charts as a single image
        const chartsContainer = document.getElementById('all-charts-container');
        if (chartsContainer) {
          const canvas = await html2canvas(chartsContainer, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true
          });
          
          const link = document.createElement('a');
          link.download = `${client.firstName}_${client.lastName}_all_metrics_charts.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      } else {
        // Export single chart
        const chartElement = document.getElementById(`chart-${selectedMetric}`);
        if (chartElement) {
          const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true
          });
          
          const link = document.createElement('a');
          const metricLabel = availableMetrics.find(m => m.key === selectedMetric)?.label || selectedMetric;
          link.download = `${client.firstName}_${client.lastName}_${metricLabel.replace(/\s+/g, '_')}_chart.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      }
    } catch (error) {
      console.error('Error exporting chart:', error);
      alert('Error exporting chart. Please try again.');
    }
  };

  if (!client) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Loading client information...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
            src={client.profilePhoto}
          >
            {client.firstName[0]}{client.lastName[0]}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {client.firstName} {client.lastName}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="textSecondary">
                Room {client.room} • Facility {client.facility.toUpperCase()}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {isAdmin && (
          <Box>
            <IconButton onClick={handleEdit} color="primary" sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
            {!isNewClient && (
              <IconButton onClick={handleDelete} color="error">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon><CalendarIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Age" 
                    secondary={`${calculateAge(client.dateOfBirth)} years old`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CalendarIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Date of Birth" 
                    secondary={formatDate(client.dateOfBirth)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={client.phone} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EmailIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={client.email} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><RoomIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Admission Date" 
                    secondary={formatDate(client.admissionDate)} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Medical Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Medical Notes:
              </Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  {client.medicalNotes}
                </Typography>
              </Paper>

            </CardContent>
          </Card>
        </Grid>

        {/* Dietary Restrictions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <RestaurantIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dietary Restrictions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" flexWrap="wrap" gap={1}>
                {client.dietaryRestrictions.map((restriction, index) => (
                  <Chip key={index} label={restriction} color="warning" size="small" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SportsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Activity Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" flexWrap="wrap" gap={1}>
                {client.activityPreferences.map((activity, index) => (
                  <Chip key={index} label={activity} color="primary" size="small" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Other Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NotesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Other Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                {client.otherPreferences.map((preference, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={preference} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Emergency Contact
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary={client.emergencyContact.name}
                    secondary={`${client.emergencyContact.relationship}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText primary={client.emergencyContact.phone} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EmailIcon /></ListItemIcon>
                  <ListItemText primary={client.emergencyContact.email} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Secondary Emergency Contact */}
        {client.secondaryEmergencyContact?.name && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Secondary Emergency Contact
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={client.secondaryEmergencyContact.name}
                      secondary={`${client.secondaryEmergencyContact.relationship}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PhoneIcon /></ListItemIcon>
                    <ListItemText primary={client.secondaryEmergencyContact.phone} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><EmailIcon /></ListItemIcon>
                    <ListItemText primary={client.secondaryEmergencyContact.email} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Analytics Section */}
      {!isNewClient && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Patient Analytics
          </Typography>
          
          {reportsLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="textSecondary">
                Loading reports...
              </Typography>
            </Box>
          )}
          
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Daily report analysis and progress tracking
            {clientReports.length > 0 ? (
              <span>
                {' '}• Showing {clientReports.length} report{clientReports.length !== 1 ? 's' : ''}
                {dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate && (
                  <span> from {new Date(customDateRange.startDate).toLocaleDateString()} to {new Date(customDateRange.endDate).toLocaleDateString()}</span>
                )}
              </span>
            ) : (
              <span style={{ color: '#f44336' }}>
                {' '}• No reports found for the selected date range. Try selecting a different range or "All Time".
              </span>
            )}
          </Typography>

          {/* Analytics Controls */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select Metric
                  </Typography>
                  <Select
                    fullWidth
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    variant="outlined"
                  >
                    <MenuItem value="all">All Metrics</MenuItem>
                    {availableMetrics.map((metric) => (
                      <MenuItem key={metric.key} value={metric.key}>
                        {metric.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Date Range
                  </Typography>
                  <Select
                    fullWidth
                    value={dateRange}
                    onChange={(e) => handleDateRangeChange(e.target.value)}
                    variant="outlined"
                  >
                    <MenuItem value="monthly">Last Month</MenuItem>
                    <MenuItem value="yearly">Last Year</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportChart}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Export Chart{selectedMetric === 'all' ? 's' : ''}
                  </Button>
                </Grid>
              </Grid>
              
              {/* Custom Date Range Picker */}
              {dateRange === 'custom' && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="subtitle2" gutterBottom>
                      Start Date
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="subtitle2" gutterBottom>
                      End Date
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      &nbsp;
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const endDate = new Date().toISOString().split('T')[0];
                        const startDate = new Date();
                        startDate.setDate(startDate.getDate() - 30);
                        const startDateStr = startDate.toISOString().split('T')[0];
                        
                        setCustomDateRange({
                          startDate: startDateStr,
                          endDate: endDate
                        });
                      }}
                      fullWidth
                      size="small"
                    >
                      Reset
                    </Button>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {selectedMetric !== 'all' && clientReports.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Average Score
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {averageScore}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {availableMetrics.find(m => m.key === selectedMetric)?.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Trend
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {trend === 'improving' && <TrendingUpIcon color="success" />}
                      {trend === 'declining' && <TrendingDownIcon color="error" />}
                      {trend === 'stable' && <TrendingFlatIcon color="info" />}
                      <Typography variant="h6" color={
                        trend === 'improving' ? 'success.main' : 
                        trend === 'declining' ? 'error.main' : 'info.main'
                      }>
                        {trend.charAt(0).toUpperCase() + trend.slice(1)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Based on recent data
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Reports
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {clientReports.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Daily assessments completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Charts */}
          {clientReports.length > 0 ? (
            selectedMetric === 'all' ? (
            <Box id="all-charts-container">
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                All Metrics Overview
              </Typography>
              <Grid container spacing={3}>
                {availableMetrics.map((metric) => {
                  const metricData = processChartData(clientReports, metric.key);
                  const dateFormatter = getDateFormatter(metricData);
                  const tickCount = getTickCount(metricData);
                  return (
                    <Grid item xs={12} md={6} key={metric.key}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {metric.label}
                          </Typography>
                          <Box id={`chart-${metric.key}`} sx={{ height: 300, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={metricData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="date" 
                                  tickFormatter={dateFormatter}
                                  fontSize={10}
                                  interval="preserveStartEnd"
                                  tickCount={tickCount}
                                  angle={metricData.length > 20 ? -45 : 0}
                                  textAnchor={metricData.length > 20 ? "end" : "middle"}
                                  height={metricData.length > 20 ? 60 : 30}
                                />
                                <YAxis domain={[0, 10]} fontSize={10} />
                                <Tooltip 
                                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                  formatter={(value, name) => [value, 'Score']}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#1976d2" 
                                  strokeWidth={2}
                                  dot={{ fill: '#1976d2', strokeWidth: 2, r: 3 }}
                                  activeDot={{ r: 5 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {availableMetrics.find(m => m.key === selectedMetric)?.label} Progress
                </Typography>
                <Box id={`chart-${selectedMetric}`} sx={{ height: 400, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={getDateFormatter(chartData)}
                        interval="preserveStartEnd"
                        tickCount={getTickCount(chartData)}
                        angle={chartData.length > 20 ? -45 : 0}
                        textAnchor={chartData.length > 20 ? "end" : "middle"}
                        height={chartData.length > 20 ? 60 : 30}
                      />
                      <YAxis domain={[0, 10]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value, name) => [value, 'Score']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#1976d2" 
                        strokeWidth={2}
                        dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No Data Available
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    No reports found for the selected date range. Try selecting a different range or "All Time" to view available data.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isNewClient ? 'Add New Client' : 'Edit Client Information'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Profile Photo Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Profile Photo</Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{ width: 80, height: 80 }}
                  src={editingClient.profilePhoto}
                >
                  {editingClient.firstName?.[0]}{editingClient.lastName?.[0]}
                </Avatar>
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-photo-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          handleInputChange('profilePhoto', event.target.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Box display="flex" gap={1} flexDirection="column">
                    <label htmlFor="profile-photo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCameraIcon />}
                        size="small"
                      >
                        Upload Photo
                      </Button>
                    </label>
                    {editingClient.profilePhoto && (
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        onClick={() => handleInputChange('profilePhoto', null)}
                      >
                        Remove Photo
                      </Button>
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Click to upload a new profile photo
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editingClient.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editingClient.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editingClient.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={editingClient.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={editingClient.dateOfBirth || ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Admission Date"
                type="date"
                value={editingClient.admissionDate || ''}
                onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room"
                value={editingClient.room || ''}
                onChange={(e) => handleInputChange('room', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Facility</InputLabel>
                <Select
                  value={editingClient.facility || ''}
                  onChange={(e) => handleInputChange('facility', e.target.value)}
                >
                  <MenuItem value="facility-a">Facility A</MenuItem>
                  <MenuItem value="facility-b">Facility B</MenuItem>
                  <MenuItem value="facility-c">Facility C</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Medical Notes"
                value={editingClient.medicalNotes || ''}
                onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Dietary Restrictions (comma-separated)"
                value={editingClient.dietaryRestrictions ? editingClient.dietaryRestrictions.join(', ') : ''}
                onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value.split(',').map(item => item.trim()).filter(item => item))}
                placeholder="e.g., Gluten-free, No nuts, Vegetarian"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Activity Preferences (comma-separated)"
                value={editingClient.activityPreferences ? editingClient.activityPreferences.join(', ') : ''}
                onChange={(e) => handleInputChange('activityPreferences', e.target.value.split(',').map(item => item.trim()).filter(item => item))}
                placeholder="e.g., Reading, Art, Sports, Music"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Other Preferences (comma-separated)"
                value={editingClient.otherPreferences ? editingClient.otherPreferences.join(', ') : ''}
                onChange={(e) => handleInputChange('otherPreferences', e.target.value.split(',').map(item => item.trim()).filter(item => item))}
                placeholder="e.g., Private room preferred, Evening study time"
              />
            </Grid>
            
            {/* Emergency Contact Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Emergency Contact</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={editingClient.emergencyContact?.name || ''}
                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relationship"
                value={editingClient.emergencyContact?.relationship || ''}
                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={editingClient.emergencyContact?.phone || ''}
                onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Email"
                value={editingClient.emergencyContact?.email || ''}
                onChange={(e) => handleEmergencyContactChange('email', e.target.value)}
              />
            </Grid>
          </Grid>
          
          {/* Secondary Emergency Contact Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Secondary Emergency Contact (Optional)
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Secondary Contact Name"
              value={editingClient.secondaryEmergencyContact?.name || ''}
              onChange={(e) => handleSecondaryEmergencyContactChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Secondary Contact Relationship"
              value={editingClient.secondaryEmergencyContact?.relationship || ''}
              onChange={(e) => handleSecondaryEmergencyContactChange('relationship', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Secondary Contact Phone"
              value={editingClient.secondaryEmergencyContact?.phone || ''}
              onChange={(e) => handleSecondaryEmergencyContactChange('phone', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Secondary Contact Email"
              value={editingClient.secondaryEmergencyContact?.email || ''}
              onChange={(e) => handleSecondaryEmergencyContactChange('email', e.target.value)}
            />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            {isNewClient ? 'Create Client' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {client.firstName} {client.lastName}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClientProfile;
