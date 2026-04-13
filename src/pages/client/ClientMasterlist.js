import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FolderOpen as FolderIcon,
  SwapHoriz as TransferIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../context/SupabaseContext';
import { useHistory } from 'react-router-dom';
import SuccessModal from '../../components/Modals/SuccessModal';
import DeleteConfirmModal from '../../components/Modals/DeleteConfirmModal';
import { getProfilePhotoUrl } from '../../utils/fileUpload';
import { calculateAge } from '../../utils/dateHelpers';
import { formatNorthAmericanPhoneInput } from '../../utils/phoneFormat';

/** Lowercase canonical status for DB/UI (handles casing/whitespace from API). */
function normalizeClientStatus(raw) {
  if (raw == null || raw === '') return 'active';
  const s = String(raw).toLowerCase().trim();
  if (s === 'active' || s === 'inactive' || s === 'discharged') return s;
  return s;
}

function buildClientTablePayload(form) {
  return {
    first_name: form.first_name,
    last_name: form.last_name,
    date_of_birth: form.date_of_birth || null,
    gender: form.gender || null,
    client_id_no: form.client_id_no || null,
    band_no: form.band_no || null,
    facility_id: form.facility_id || null,
    room: form.room || null,
    phone: form.phone || null,
    email: form.email || null,
    address: form.address || null,
    status: normalizeClientStatus(form.status) || 'active',
    medical_notes: form.medical_notes || null,
    dietary_restrictions: form.dietary_restrictions || null,
    activity_preferences: form.activity_preferences || null,
    other_preferences: form.other_preferences || null,
    emergency_contact_name: form.emergency_contact_name || null,
    emergency_contact_relationship: form.emergency_contact_relationship || null,
    emergency_contact_phone: form.emergency_contact_phone || null,
    emergency_contact_email: form.emergency_contact_email || null,
  };
}

function ClientMasterlist() {
  const { userProfile } = useSupabase();
  const history = useHistory();
  const queryClient = useQueryClient();
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
  const [clientPhotoUrls, setClientPhotoUrls] = useState({});
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('first_name'); // 'first_name', 'last_name', 'age', 'admission_date', 'band_no', 'status'
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Default: 50 items per page
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

  // ✅ FIX #4: Cached clients query - only fetches if data is stale (>5 minutes old)
  // ✅ FIX #5: Sort in database by status then first_name (instead of client-side sorting)
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
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
        .limit(1000); // Increased limit to allow client-side filtering

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    onError: (err) => {
      console.error('Error fetching clients:', err);
      setError(err.message);
    },
  });

  // ✅ FIX #4: Cached facilities query - 30 minute cache (rarely changes)
  const { data: facilitiesData, isLoading: facilitiesLoading } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes (facilities rarely change)
  });

  // Filter and sort clients
  const clients = useMemo(() => {
    if (!clientsData) return [];
    
    let filtered = clientsData.map((client) => ({
      ...client,
      status: normalizeClientStatus(client.status),
    }));
    
    // Apply search filter (name, address)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        (client.first_name && client.first_name.toLowerCase().includes(searchLower)) ||
        (client.last_name && client.last_name.toLowerCase().includes(searchLower)) ||
        (client.facilities?.name && client.facilities.name.toLowerCase().includes(searchLower)) ||
        (client.facilities?.address && client.facilities.address.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting/filtering based on selected option
    filtered.sort((a, b) => {
      switch (filterBy) {
        case 'first_name':
          const firstNameA = (a.first_name || '').toLowerCase();
          const firstNameB = (b.first_name || '').toLowerCase();
          return firstNameA.localeCompare(firstNameB);
        
        case 'last_name':
          const lastNameA = (a.last_name || '').toLowerCase();
          const lastNameB = (b.last_name || '').toLowerCase();
          return lastNameA.localeCompare(lastNameB);
        
        case 'age':
          const ageA = calculateAge(a.date_of_birth);
          const ageB = calculateAge(b.date_of_birth);
          if (ageA === 'N/A') return 1;
          if (ageB === 'N/A') return -1;
          return ageA - ageB; // Ascending (youngest to oldest)
        
        case 'admission_date':
          if (!a.admission_date) return 1;
          if (!b.admission_date) return -1;
          return new Date(b.admission_date) - new Date(a.admission_date); // Descending (most recent first)
        
        case 'band_no':
          const bandA = a.band_no ? parseFloat(a.band_no) : Infinity;
          const bandB = b.band_no ? parseFloat(b.band_no) : Infinity;
          if (isNaN(bandA) && isNaN(bandB)) {
            // Both are non-numeric, sort alphabetically
            return (a.band_no || '').localeCompare(b.band_no || '');
          }
          if (isNaN(bandA)) return 1;
          if (isNaN(bandB)) return -1;
          return bandA - bandB; // Ascending (numerical order)
        
        case 'status':
          const statusA = (a.status || 'active').toLowerCase();
          const statusB = (b.status || 'active').toLowerCase();
          // Active should come first
          if (statusA === 'active' && statusB !== 'active') return -1;
          if (statusA !== 'active' && statusB === 'active') return 1;
          return statusA.localeCompare(statusB);
        
        case 'facility':
          // Group by facility - sort by facility name, then by first name within each facility
          const facilityNameA = (a.facilities?.name || 'No Facility').toLowerCase();
          const facilityNameB = (b.facilities?.name || 'No Facility').toLowerCase();
          const facilityCompare = facilityNameA.localeCompare(facilityNameB);
          if (facilityCompare !== 0) return facilityCompare;
          // If same facility, sort by first name
          const facilityFirstNameA = (a.first_name || '').toLowerCase();
          const facilityFirstNameB = (b.first_name || '').toLowerCase();
          return facilityFirstNameA.localeCompare(facilityFirstNameB);
        
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [clientsData, searchTerm, filterBy]);

  // Calculate paginated clients (only if > 100 total clients)
  const totalClients = clients.length;
  const shouldPaginate = totalClients > 100;
  const paginatedClients = useMemo(() => {
    if (!shouldPaginate) return clients;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return clients.slice(startIndex, endIndex);
  }, [clients, currentPage, itemsPerPage, shouldPaginate]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBy]);

  // Load signed URLs for profile photos
  useEffect(() => {
    const loadPhotoUrls = async () => {
      if (!clientsData || clientsData.length === 0) return;
      
      const photoUrlPromises = clientsData
        .filter(client => client.profile_photo_url)
        .map(async (client) => {
          try {
            const signedUrl = await getProfilePhotoUrl(client.profile_photo_url, 3600);
            return { clientId: client.id, url: signedUrl };
          } catch (error) {
            console.error(`Error loading photo for client ${client.id}:`, error);
            return null;
          }
        });
      
      const photoResults = await Promise.all(photoUrlPromises);
      const photoUrlMap = {};
      photoResults.forEach(result => {
        if (result) {
          photoUrlMap[result.clientId] = result.url;
        }
      });
      setClientPhotoUrls(photoUrlMap);
    };
    
    loadPhotoUrls();
  }, [clientsData]);

  const facilities = facilitiesData || [];
  const loading = clientsLoading || facilitiesLoading;

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
      phone: formatNorthAmericanPhoneInput(client.phone || ''),
      email: client.email,
      address: client.address,
      status: normalizeClientStatus(client.status),
      medical_notes: client.medical_notes,
      dietary_restrictions: client.dietary_restrictions,
      activity_preferences: client.activity_preferences,
      other_preferences: client.other_preferences,
      emergency_contact_name: client.emergency_contact_name,
      emergency_contact_relationship: client.emergency_contact_relationship,
      emergency_contact_phone: formatNorthAmericanPhoneInput(client.emergency_contact_phone || ''),
      emergency_contact_email: client.emergency_contact_email
    });
    setOpenDialog(true);
  };

  const handleSaveClient = async () => {
    try {
      const payload = buildClientTablePayload(clientForm);

      if (editingClient) {
        const { data: updatedRow, error } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', editingClient.id)
          .select()
          .maybeSingle();

        if (error) throw error;

        queryClient.setQueryData(['clients'], (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((c) =>
            c.id === editingClient.id
              ? {
                  ...c,
                  ...payload,
                  ...(updatedRow || {}),
                  facilities: c.facilities,
                  status: normalizeClientStatus(
                    updatedRow?.status ?? payload.status
                  ),
                }
              : c
          );
        });
      } else {
        const { data: insertedRows, error } = await supabase
          .from('clients')
          .insert([payload])
          .select();

        if (error) throw error;
        if (insertedRows?.length) {
          queryClient.setQueryData(['clients'], (old) => {
            const list = Array.isArray(old) ? old : [];
            return [...insertedRows.map((row) => ({ ...row, status: normalizeClientStatus(row.status) })), ...list];
          });
        }
      }

      setOpenDialog(false);
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSuccessMessage(`Client has been ${editingClient ? 'updated' : 'created'} successfully.`);
      setSuccessModalOpen(true);
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
      
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
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

      const clientName = `${transferringClient.first_name} ${transferringClient.last_name}`;
      
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      setOpenTransferDialog(false);
      setTransferringClient(null);
      setSuccessMessage(`Client "${clientName}" has been transferred successfully.`);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Error transferring client:', err);
      setError(err.message);
    }
  };


  const getStatusColor = (status) => {
    switch (normalizeClientStatus(status)) {
      case 'active':
        return 'success';
      case 'discharged':
        return 'warning';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusChipLabel = (status) => {
    const n = normalizeClientStatus(status);
    if (n === 'active') return 'Active';
    if (n === 'discharged') return 'Discharged';
    if (n === 'inactive') return 'Inactive';
    return status ? String(status) : 'Active';
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterBy('first_name');
  };

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

      {/* Search and Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              placeholder="Search by name or facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter By</InputLabel>
              <Select
                value={filterBy}
                label="Filter By"
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <MenuItem value="first_name">First Name (A-Z)</MenuItem>
                <MenuItem value="last_name">Last Name (A-Z)</MenuItem>
                <MenuItem value="age">Age (Youngest to Oldest)</MenuItem>
                <MenuItem value="admission_date">Admission Date (Most Recent)</MenuItem>
                <MenuItem value="band_no">Band No (Numerical)</MenuItem>
                <MenuItem value="status">Status (Active First)</MenuItem>
                <MenuItem value="facility">Group by Facility</MenuItem>
              </Select>
            </FormControl>
            {(searchTerm || filterBy !== 'first_name') && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="text.secondary">
          {shouldPaginate ? (
            <>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalClients)} of {totalClients} clients</>
          ) : (
            <>Showing {totalClients} of {clientsData?.length || 0} clients</>
          )}
        </Typography>
        {shouldPaginate && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Per Page</InputLabel>
            <Select
              value={itemsPerPage}
              label="Per Page"
              onChange={(e) => {
                setItemsPerPage(e.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

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
                      <TableCell>Admission Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar 
                          sx={{ bgcolor: 'primary.main' }}
                          src={clientPhotoUrls[client.id]}
                        >
                          {clientPhotoUrls[client.id] ? null : getGenderIcon(client.gender)}
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
                        {client.facilities?.name || 'No Facility'}
                      </Typography>
                      {client.facilities?.address && (
                        <Typography variant="caption" color="textSecondary">
                          {client.facilities.address}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{client.room || 'N/A'}</TableCell>
                    <TableCell>
                      {client.admission_date 
                        ? new Date(client.admission_date).toLocaleDateString() 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusChipLabel(client.status)}
                        color={getStatusColor(client.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => history.push(`/app/client/${client.id}`)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Files">
                        <IconButton
                          size="small"
                          onClick={() => handleViewFiles(client.id)}
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
          
          {/* Pagination Controls */}
          {shouldPaginate && (
            <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
              <Pagination
                count={Math.ceil(totalClients / itemsPerPage)}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
                showFirstButton
                showLastButton
                size="large"
              />
            </Box>
          )}
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
                  type="tel"
                  placeholder="000-000-0000"
                  value={clientForm.phone}
                  onChange={(e) =>
                    setClientForm((prev) => ({
                      ...prev,
                      phone: formatNorthAmericanPhoneInput(e.target.value),
                    }))
                  }
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
                  type="tel"
                  placeholder="000-000-0000"
                  value={clientForm.emergency_contact_phone}
                  onChange={(e) =>
                    setClientForm((prev) => ({
                      ...prev,
                      emergency_contact_phone: formatNorthAmericanPhoneInput(e.target.value),
                    }))
                  }
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
                Current Facility: {transferringClient.facilities?.name || 'No Facility'}
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
