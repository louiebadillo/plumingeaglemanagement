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
  TextField,
  InputAdornment,
  Grid,
  MenuItem
} from '@mui/material';
import { 
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Assignment as ReportIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { getClientById } from '../../context/clientMock';
import { getCurrentUserRole } from '../../components/Sidebar/getSidebarStructure';

// Mock reports data - in a real app, this would come from the database
const mockReports = [
  {
    id: 1,
    clientId: 1,
    date: '2024-01-15',
    shift: 'Morning',
    staffMember: 'Current User',
    status: 'incomplete',
    lastSaved: '2024-01-15T10:30:00Z',
    questionnaire: {
      mood: 7,
      behavior: 6,
      sleep: 8,
      appetite: 5,
      social: 7,
      physical: 6,
      cognitive: 7,
      emotional: 6
    },
    notes: 'Client had a good morning, participated in activities...',
    incidents: '',
    medications: 'Took morning medication as scheduled',
    goalsProgress: 'Working on social interaction goals'
  },
  {
    id: 2,
    clientId: 2,
    date: '2024-01-15',
    shift: 'Afternoon',
    staffMember: 'Current User',
    status: 'submitted',
    lastSaved: '2024-01-15T14:45:00Z',
    questionnaire: {
      mood: 8,
      behavior: 7,
      sleep: 6,
      appetite: 8,
      social: 9,
      physical: 7,
      cognitive: 8,
      emotional: 7
    },
    notes: 'Excellent afternoon session, very engaged',
    incidents: '',
    medications: 'All medications taken on time',
    goalsProgress: 'Great progress on communication goals'
  },
  {
    id: 3,
    clientId: 1,
    date: '2024-01-14',
    shift: 'Evening',
    staffMember: 'Current User',
    status: 'submitted',
    lastSaved: '2024-01-14T22:15:00Z',
    questionnaire: {
      mood: 5,
      behavior: 4,
      sleep: 6,
      appetite: 5,
      social: 4,
      physical: 5,
      cognitive: 6,
      emotional: 5
    },
    notes: 'Client seemed tired in the evening, less engaged',
    incidents: 'Minor incident during dinner - became agitated',
    medications: 'Evening medication taken',
    goalsProgress: 'Some regression in social goals today'
  },
  // Reports from other employees
  {
    id: 4,
    clientId: 2,
    date: '2024-01-15',
    shift: 'Morning',
    staffMember: 'Sarah Johnson',
    status: 'submitted',
    lastSaved: '2024-01-15T08:30:00Z',
    questionnaire: {
      mood: 8,
      behavior: 7,
      sleep: 9,
      appetite: 8,
      social: 7,
      physical: 8,
      cognitive: 8,
      emotional: 7
    },
    notes: 'Client had a great morning, very cooperative',
    incidents: 'None',
    medications: 'Morning medication taken on time',
    goalsProgress: 'Excellent progress on communication goals'
  },
  {
    id: 5,
    clientId: 3,
    date: '2024-01-15',
    shift: 'Afternoon',
    staffMember: 'Mike Chen',
    status: 'submitted',
    lastSaved: '2024-01-15T14:45:00Z',
    questionnaire: {
      mood: 6,
      behavior: 5,
      sleep: 7,
      appetite: 6,
      social: 5,
      physical: 6,
      cognitive: 7,
      emotional: 6
    },
    notes: 'Client was somewhat withdrawn during activities',
    incidents: 'Minor behavioral issue during group activity',
    medications: 'Afternoon medication taken',
    goalsProgress: 'Moderate progress on social interaction goals'
  },
  {
    id: 6,
    clientId: 1,
    date: '2024-01-14',
    shift: 'Morning',
    staffMember: 'Emily Davis',
    status: 'submitted',
    lastSaved: '2024-01-14T09:15:00Z',
    questionnaire: {
      mood: 7,
      behavior: 6,
      sleep: 8,
      appetite: 7,
      social: 6,
      physical: 7,
      cognitive: 7,
      emotional: 6
    },
    notes: 'Client was in good spirits, participated well in activities',
    incidents: 'None',
    medications: 'Morning medication taken',
    goalsProgress: 'Good progress on daily living skills'
  }
];

function MyReports() {
  const history = useHistory();
  const location = useLocation();
  const [reports, setReports] = useState(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Get current user role
  const userRole = getCurrentUserRole();
  const isAdmin = userRole === 'admin';

  // Load reports from localStorage on component mount
  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem('dailyReports') || '[]');
    if (savedReports.length > 0) {
      setReports(prevReports => [...savedReports, ...prevReports]);
    }
  }, []);

  // Handle URL parameters for filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const statusParam = urlParams.get('status');
    if (statusParam && ['all', 'submitted', 'incomplete'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
  }, [location.search]);

  const filteredReports = reports.filter(report => {
    const client = getClientById(report.clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
    
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.shift.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.date.includes(searchTerm) ||
                         report.staffMember.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    // For admins: show all reports
    // For employees: show only their own reports
    const matchesUser = isAdmin || report.staffMember === 'Current User';
    
    return matchesSearch && matchesStatus && matchesUser;
  });

  const handleEditReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      history.push(`/app/reports/create?clientId=${report.clientId}&edit=${reportId}`);
    }
  };

  const handleViewReport = (reportId) => {
    history.push(`/app/reports/view/${reportId}`);
  };

  const handleExportReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const client = getClientById(report.clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';

    // Create a comprehensive report document
    const reportData = {
      'Report ID': report.id,
      'Date': new Date(report.date).toLocaleDateString(),
      'Client': clientName,
      'Staff Member': report.staffMember,
      'Shift': report.shift,
      'Status': getStatusLabel(report.status),
      'Last Saved': new Date(report.lastSaved).toLocaleString(),
      '': '', // Empty line for spacing
      'Health Assessment (1-10 Scale)': '',
      'Mood': report.questionnaire.mood,
      'Behavior': report.questionnaire.behavior,
      'Sleep Quality': report.questionnaire.sleep,
      'Appetite': report.questionnaire.appetite,
      'Social Interaction': report.questionnaire.social,
      'Physical Health': report.questionnaire.physical,
      'Cognitive Function': report.questionnaire.cognitive,
      'Emotional State': report.questionnaire.emotional,
      '': '', // Empty line for spacing
      'Notes': report.notes || 'No notes provided',
      'Incidents': report.incidents || 'No incidents reported',
      'Medications': report.medications || 'No medication notes',
      'Goals Progress': report.goalsProgress || 'No progress notes'
    };

    // Convert to CSV format
    const csvContent = Object.entries(reportData)
      .map(([key, value]) => `"${key}","${value}"`)
      .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Daily_Report_${clientName.replace(/\s+/g, '_')}_${report.date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'incomplete': return 'warning';
      case 'submitted': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'incomplete': return 'Draft';
      case 'submitted': return 'Submitted';
      default: return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isAdmin ? 'All Daily Reports' : 'My Daily Reports'}
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        {isAdmin 
          ? 'View and manage all daily reports submitted by staff members'
          : 'View and manage your daily reports for clients'
        }
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={isAdmin 
              ? "Search by client name, shift, date, or staff member"
              : "Search by client name, shift, or date"
            }
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
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Reports</MenuItem>
            <MenuItem value="incomplete">Drafts</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reports ({filteredReports.length})
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Shift</TableCell>
                  {isAdmin && <TableCell>Staff Member</TableCell>}
                  <TableCell>Status</TableCell>
                  <TableCell>Last Saved</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => {
                    const client = getClientById(report.clientId);
                    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
                    
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          {new Date(report.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <ReportIcon color="primary" />
                            <Typography variant="subtitle2">
                              {clientName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{report.shift}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Typography variant="body2">
                              {report.staffMember}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip 
                            label={getStatusLabel(report.status)} 
                            color={getStatusColor(report.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(report.lastSaved).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            {report.status === 'incomplete' ? (
                              <Tooltip title="Continue Editing">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditReport(report.id)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <>
                                {isAdmin ? (
                                  <Tooltip title="Edit Report (Admin)">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleEditReport(report.id)}
                                      color="primary"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="View Report">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleViewReport(report.id)}
                                      color="primary"
                                    >
                                      <ViewIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            )}
                            {isAdmin && (
                              <Tooltip title="Export Report">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleExportReport(report.id)}
                                  color="secondary"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'No reports found matching your criteria.' 
                          : 'No reports found. Create your first report from a facility page.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default MyReports;
