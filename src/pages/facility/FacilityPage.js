import React, { useState, useEffect } from 'react';
import {
  Grid,
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
  Chip,
  Avatar,
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as ReportIcon
} from '@mui/icons-material';
import { useParams, useHistory } from 'react-router-dom';
import { getClientsByFacility } from '../../context/clientMock';
import { getCurrentUserRole } from '../../components/Sidebar/getSidebarStructure';

// Facility information
const facilityData = {
  'facility-a': {
    name: 'Facility A',
    description: 'Group Home - Main House'
  },
  'facility-b': {
    name: 'Facility B',
    description: 'Group Home - Transition House'
  },
  'facility-c': {
    name: 'Facility C',
    description: 'Group Home - Specialized Care'
  }
};

function FacilityPage() {
  const { facilityId } = useParams();
  const history = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);

  const currentFacility = facilityData[facilityId];
  const userRole = getCurrentUserRole();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    console.log('FacilityPage - facilityId:', facilityId);
    console.log('FacilityPage - currentFacility:', currentFacility);
    
    if (!currentFacility) {
      console.log('No facility found, redirecting to facility-a');
      history.push('/app/facility/facility-a'); // Redirect to a default if URL is invalid
    } else {
      // Load clients for this facility
      const facilityClients = getClientsByFacility(facilityId);
      console.log('Loaded clients:', facilityClients);
      setClients(facilityClients);
    }
  }, [facilityId, currentFacility, history]);

  if (!currentFacility) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Loading facility data...</Typography>
        <Typography variant="body2" color="textSecondary">
          Facility ID: {facilityId || 'undefined'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Available facilities: facility-a, facility-b, facility-c
        </Typography>
      </Box>
    );
  }

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewClient = (clientId) => {
    history.push(`/app/client/${clientId}`);
  };

  const handleEditClient = (clientId) => {
    history.push(`/app/client/${clientId}/edit`);
  };

  const handleDeleteClient = (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      // In a real app, this would delete from database
      console.log('Deleting client:', clientId);
      setClients(clients.filter(client => client.id !== clientId));
      alert('Client deleted successfully!');
    }
  };

  const handleAddClient = () => {
    history.push(`/app/client/new?facility=${facilityId}`);
  };

  const handleCreateReport = (clientId) => {
    history.push(`/app/reports/create?clientId=${clientId}&facility=${facilityId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {currentFacility.name} - {currentFacility.description}
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Clients in {currentFacility.name}</Typography>
                {isAdmin && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddClient}
                  >
                    Add Client
                  </Button>
                )}
              </Box>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search clients by name or room"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Photo</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Admission Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <TableRow key={client.id} hover>
                          <TableCell>
                            <Avatar
                              sx={{ width: 40, height: 40 }}
                              src={client.profilePhoto}
                            >
                              {client.firstName[0]}{client.lastName[0]}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {client.firstName} {client.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>{client.age}</TableCell>
                          <TableCell>{client.room}</TableCell>
                          <TableCell>
                            {new Date(client.admissionDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewClient(client.id)}
                                  color="primary"
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Create Daily Report">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCreateReport(client.id)}
                                  color="success"
                                >
                                  <ReportIcon />
                                </IconButton>
                              </Tooltip>
                              {isAdmin && (
                                <>
                                  <Tooltip title="Edit Client">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleEditClient(client.id)}
                                      color="secondary"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Client">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteClient(client.id)}
                                      color="error"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="textSecondary">
                            {searchTerm ? 'No clients found matching your search.' : 'No clients in this facility.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FacilityPage;