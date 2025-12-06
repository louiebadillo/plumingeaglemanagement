import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
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
  Alert,
  CircularProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FolderOpen as FolderIcon,
  SwapHoriz as TransferIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../context/SupabaseContext';
import { useHistory } from 'react-router-dom';
import SuccessModal from '../../components/Modals/SuccessModal';
import DeleteConfirmModal from '../../components/Modals/DeleteConfirmModal';

function ClientMasterlist() {
  const { userProfile } = useSupabase();
  const history = useHistory();
  const [clients, setClients] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [transferringClient, setTransferringClient] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [clientForm, setClientForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    client_id_no: '',
    band_no: '',
    facility_id: '',
    room: '',
    phone: '',
    email: '',
    address: '',
    status: 'active',
    medical_notes: '',
    dietary_restrictions: '',
    activity_preferences: '',
    other_preferences: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    emergency_contact_email: ''
  });

  useEffect(() => {
    fetchClients();
    fetchFacilities();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          facilities (
            id,
            name,
            address
          )
        `)
        .order('first_name');

      if (error) throw error;
      
      // Sort clients: active first, then discharged
      const sortedClients = (data || []).sort((a, b) => {
        const statusA = (a.status || 'active').toLowerCase();
        const statusB = (b.status || 'active').toLowerCase();
        
        // Active clients come first
        if (statusA === 'active' && statusB !== 'active') return -1;
        if (statusA !== 'active' && statusB === 'active') return 1;
        
        // Within same status, sort by first name
        return (a.first_name || '').localeCompare(b.first_name || '');
      });
      
      setClients(sortedClients);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setFacilities(data || []);
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleAddClient = () => {
    // Navigate to the comprehensive client creation form
    // The form will show a facility selection questionnaire first
    history.push('/app/client/new');
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setClientForm({
      first_name: client.first_name,
      last_name: client.last_name,
      date_of_birth: client.date_of_birth,
      gender: client.gender,
      client_id_no: client.client_id_no || '',
      band_no: client.band_no || '',
      facility_id: client.facility_id,
      room: client.room,
      phone: client.phone,
      email: client.email,
      address: client.address,
      status: client.status || 'active',
      medical_notes: client.medical_notes,
      dietary_restrictions: client.dietary_restrictions,
      activity_preferences: client.activity_preferences,
      other_preferences: client.other_preferences,
      emergency_contact_name: client.emergency_contact_name,
      emergency_contact_relationship: client.emergency_contact_relationship,
      emergency_contact_phone: client.emergency_contact_phone,
      emergency_contact_email: client.emergency_contact_email
    });
    setOpenDialog(true);
  };

  const handleSaveClient = async () => {
    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(clientForm)
          .eq('id', editingClient.id);

        if (error) throw error;
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([clientForm]);

        if (error) throw error;
      }

      setOpenDialog(false);
      fetchClients();
    } catch (err) {
      console.error('Error saving client:', err);
      setError(err.message);
    }
  };

  const handleDeleteClient = (client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;
      
      const clientName = `${clientToDelete.first_name} ${clientToDelete.last_name}`;
      
      // Close delete dialog and show success
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      setSuccessMessage(`Client "${clientName}" has been deleted successfully.`);
      setSuccessModalOpen(true);
      
      // Refresh the clients list
      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewFiles = (clientId) => {
    console.log('Navigating to files for client ID:', clientId);
    console.log('Client ID type:', typeof clientId);
    console.log('Client ID value:', clientId);
    // Navigate to dedicated files page using client ID
    history.push(`/app/client/${clientId}/files`);
  };


  const handleTransferClient = (client) => {
    setTransferringClient(client);
    setOpenTransferDialog(true);
  };

  const handleConfirmTransfer = async () => {
    if (!transferringClient) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          facility_id: transferringClient.newFacilityId,
          updated_at: new Date().toISOString()
        })
        .eq('id', transferringClient.id);

      if (error) throw error;

      // Refresh the clients list
      fetchClients();
      setOpenTransferDialog(false);
      setTransferringClient(null);
    } catch (err) {
      console.error('Error transferring client:', err);
      setError(err.message);
    }
  };


  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'discharged': return 'warning';
      default: return 'success'; // Default to active
    }
  };

  const getGenderIcon = (gender) => {
    return gender === 'Male' ? '👨' : gender === 'Female' ? '👩' : '👤';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Client Masterlist
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClient}
        >
          Add Client
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Client</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Client ID No</TableCell>
                      <TableCell>Band No</TableCell>
                      <TableCell>Facility</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getGenderIcon(client.gender)}
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="subtitle2"
                            sx={{ 
                              cursor: 'pointer',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => {
                              // Use client ID for more reliable routing
                              const clientUrl = `/app/client/${client.id}`;
                              history.push(clientUrl);
                            }}
                          >
                            {client.first_name} {client.last_name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{calculateAge(client.date_of_birth)}</TableCell>
                    <TableCell>{client.gender}</TableCell>
                    <TableCell>{client.client_id_no || 'N/A'}</TableCell>
                    <TableCell>{client.band_no || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {client.facilities?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {client.facilities?.address}
                      </Typography>
                    </TableCell>
                    <TableCell>{client.room || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={client.status === 'active' ? 'Active' : client.status === 'discharged' ? 'Discharged' : 'Active'}
                        color={getStatusColor(client.status || 'active')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Files">
                        <IconButton
                          size="small"
                          onClick={() => {
                            console.log('Client data:', client);
                            console.log('Client ID from data:', client.id);
                            handleViewFiles(client.id);
                          }}
                          color="primary"
                        >
                          <FolderIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Transfer Client">
                        <IconButton
                          size="small"
                          onClick={() => handleTransferClient(client)}
                          color="secondary"
                        >
                          <TransferIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Client">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClient(client)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Client Edit Dialog - Only for editing existing clients */}
      {editingClient && (
        <Dialog open={openDialog} onClose={() => {
          setOpenDialog(false);
          setEditingClient(null);
        }} maxWidth="md" fullWidth>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={clientForm.first_name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={clientForm.last_name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={clientForm.date_of_birth}
                  onChange={(e) => setClientForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={clientForm.gender}
                    label="Gender"
                    onChange={(e) => setClientForm(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Facility</InputLabel>
                  <Select
                    value={clientForm.facility_id}
                    label="Facility"
                    onChange={(e) => setClientForm(prev => ({ ...prev, facility_id: e.target.value }))}
                  >
                    {facilities.map((facility) => (
                      <MenuItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Room Number"
                  value={clientForm.room}
                  onChange={(e) => setClientForm(prev => ({ ...prev, room: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client ID No"
                  value={clientForm.client_id_no}
                  onChange={(e) => setClientForm(prev => ({ ...prev, client_id_no: e.target.value }))}
                  placeholder="Enter client ID number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Band No"
                  value={clientForm.band_no}
                  onChange={(e) => setClientForm(prev => ({ ...prev, band_no: e.target.value }))}
                  placeholder="Enter band number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={clientForm.status}
                    label="Status"
                    onChange={(e) => setClientForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="discharged">Discharged</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={clientForm.address}
                  onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  value={clientForm.emergency_contact_name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  value={clientForm.emergency_contact_phone}
                  onChange={(e) => setClientForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Medical Notes"
                  value={clientForm.medical_notes}
                  onChange={(e) => setClientForm(prev => ({ ...prev, medical_notes: e.target.value }))}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              setEditingClient(null);
            }}>Cancel</Button>
            <Button onClick={handleSaveClient} variant="contained">
              Update Client
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Transfer Dialog */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Client</DialogTitle>
        <DialogContent>
          {transferringClient && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Transfer {transferringClient.first_name} {transferringClient.last_name}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Current Facility: {transferringClient.facilities?.name || 'Unknown'}
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Select New Facility</InputLabel>
                <Select
                  value={transferringClient.newFacilityId || ''}
                  label="Select New Facility"
                  onChange={(e) => setTransferringClient(prev => ({ 
                    ...prev, 
                    newFacilityId: e.target.value 
                  }))}
                >
                  {facilities
                    .filter(facility => facility.id !== transferringClient.facility_id)
                    .map((facility) => (
                      <MenuItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> This will move the client to a different facility. 
                  All existing reports and files will remain associated with this client.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmTransfer} 
            variant="contained"
            color="secondary"
            disabled={!transferringClient?.newFacilityId}
          >
            Transfer Client
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Modal */}
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Success!"
        message={successMessage}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        itemName={clientToDelete ? `${clientToDelete.first_name} ${clientToDelete.last_name}` : ''}
        message={`Are you sure you want to delete the client "${clientToDelete ? `${clientToDelete.first_name} ${clientToDelete.last_name}` : ''}"?`}
        warningMessage="This action cannot be undone. All associated data will be permanently removed."
        loading={deleting}
      />
    </Box>
  );
}

export default ClientMasterlist;
