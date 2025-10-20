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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
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
import { useSupabase } from '../../context/SupabaseContext';
import { createClientUrl } from '../../utils/urlUtils';

// Initial form data for creating/editing clients
const initialClientFormData = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  phone: '',
  email: '',
  address: ''
};

function FacilityPage() {
  const { facilityId } = useParams();
  const history = useHistory();
  const { userProfile } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [formData, setFormData] = useState(initialClientFormData);
  const [submitting, setSubmitting] = useState(false);

  const userRole = userProfile?.role || 'employee';
  const isAdmin = userRole === 'admin';
  
  // Debug logging
  console.log('🔍 FacilityPage - User Profile:', userProfile);
  console.log('🔍 FacilityPage - User Role:', userRole);
  console.log('🔍 FacilityPage - Is Admin:', isAdmin);

  // Load facility and clients from Supabase
  useEffect(() => {
    const loadFacilityAndClients = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading facility and clients for ID:', facilityId);
        
        // Load facility information
        const facilityResponse = await fetch(`https://brkbypctkcczerntfpsa.supabase.co/rest/v1/facilities?id=eq.${facilityId}`, {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxOTQ4MSwiZXhwIjoyMDczNzk1NDgxfQ.cYWIFwvE3FvF3rVfcP8HOuppqD71t44kdHk6Ti0Z5cw',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxOTQ4MSwiZXhwIjoyMDczNzk1NDgxfQ.cYWIFwvE3FvF3rVfcP8HOuppqD71t44kdHk6Ti0Z5cw',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!facilityResponse.ok) {
          throw new Error(`HTTP error! status: ${facilityResponse.status}`);
        }
        
        const facilityData = await facilityResponse.json();
        if (facilityData && facilityData.length > 0) {
          setFacility(facilityData[0]);
          console.log('✅ Facility loaded:', facilityData[0]);
        } else {
          console.log('❌ Facility not found, redirecting to first available facility');
          // Try to redirect to the first available facility instead of management
          const response = await fetch(`https://brkbypctkcczerntfpsa.supabase.co/rest/v1/facilities?select=*&limit=1`, {
            method: 'GET',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxOTQ4MSwiZXhwIjoyMDczNzk1NDgxfQ.cYWIFwvE3FvF3rVfcP8HOuppqD71t44kdHk6Ti0Z5cw',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxOTQ4MSwiZXhwIjoyMDczNzk1NDgxfQ.cYWIFwvE3FvF3rVfcP8HOuppqD71t44kdHk6Ti0Z5cw',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            const facilities = await response.json();
            if (facilities && facilities.length > 0) {
              console.log('🔄 Redirecting to first available facility:', facilities[0].id);
              history.push(`/app/facility/${facilities[0].id}`);
              return;
            }
          }
          
          // Fallback to management if no facilities found
          console.log('🔄 No facilities found, redirecting to facility management');
          history.push('/app/facility/management');
          return;
        }
        
        // Load clients for this facility
        const clientsResponse = await fetch(`https://brkbypctkcczerntfpsa.supabase.co/rest/v1/clients?facility_id=eq.${facilityId}`, {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxOTQ4MSwiZXhwIjoyMDczNzk1NDgxfQ.cYWIFwvE3FvF3rVfcP8HOuppqD71t44kdHk6Ti0Z5cw',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxOTQ4MSwiZXhwIjoyMDczNzk1NDgxfQ.cYWIFwvE3FvF3rVfcP8HOuppqD71t44kdHk6Ti0Z5cw',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!clientsResponse.ok) {
          throw new Error(`HTTP error! status: ${clientsResponse.status}`);
        }
        
        const clientsData = await clientsResponse.json();
        setClients(clientsData || []);
        console.log('✅ Clients loaded:', clientsData);
        
      } catch (error) {
        console.error('💥 Error loading facility and clients:', error);
        setClients([]);
        setFacility(null);
      } finally {
        setLoading(false);
      }
    };

    if (facilityId) {
      loadFacilityAndClients();
    }
  }, [facilityId, history]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress size={24} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading facility and client data...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!facility) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Facility not found
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => history.push('/app/facility/management')}
          sx={{ mt: 2 }}
        >
          Back to Facility Management
        </Button>
      </Box>
    );
  }

  const filteredClients = clients.filter(client =>
    client && client.first_name && client.last_name &&
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewClient = (client) => {
    const clientUrl = createClientUrl(client);
    history.push(clientUrl);
  };

  const handleEditClient = (client) => {
    const clientUrl = createClientUrl(client, 'edit');
    history.push(clientUrl);
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
        {facility.name} - {facility.description}
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Clients in {facility.name}</Typography>
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
                placeholder="Search clients by name"
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
                      <TableCell>Phone</TableCell>
                      <TableCell>Created Date</TableCell>
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
                            >
                              {client.first_name?.[0]}{client.last_name?.[0]}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {client.first_name} {client.last_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {client.date_of_birth ? 
                              new Date().getFullYear() - new Date(client.date_of_birth).getFullYear() : 
                              'N/A'
                            }
                          </TableCell>
                          <TableCell>{client.phone || 'N/A'}</TableCell>
                          <TableCell>
                            {client.created_at ? 
                              new Date(client.created_at).toLocaleDateString() : 
                              'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewClient(client)}
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
                                      onClick={() => handleEditClient(client)}
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
                            {searchTerm ? 'No clients found matching your search.' : isAdmin ? 'No clients in this facility. Click "Add Client" to add the first client.' : 'No clients in this facility.'}
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