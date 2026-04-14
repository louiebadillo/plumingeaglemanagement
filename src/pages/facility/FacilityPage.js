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
  Alert,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  PersonAdd as PersonAddIcon,
  SwapHoriz as TransferIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as ReportIcon
} from '@mui/icons-material';
import { useParams, useHistory } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import { createClientUrl } from '../../utils/urlUtils';
import { supabase } from '../../lib/supabase';
import DateSelectionModal from '../../components/DailyReport/DateSelectionModal';
import { getProfilePhotoUrl } from '../../utils/fileUpload';
import { shieldEntityDialogClose } from '../../hooks/useDialogCloseGuard';

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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPhotoUrls, setClientPhotoUrls] = useState({});
  // Add Client (transfer) modal
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [allClientsForTransfer, setAllClientsForTransfer] = useState([]);
  const [facilitiesList, setFacilitiesList] = useState([]);
  const [transferModalLoading, setTransferModalLoading] = useState(false);
  const [selectedTransferIds, setSelectedTransferIds] = useState(new Set());
  const [transferTarget, setTransferTarget] = useState('this'); // 'this' | 'other'
  const [selectedTransferFacilityId, setSelectedTransferFacilityId] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferSuccessMessage, setTransferSuccessMessage] = useState('');
  const [transferError, setTransferError] = useState('');
  // Transfer selected (clients in this facility) modal
  const [selectedClientsInFacility, setSelectedClientsInFacility] = useState(new Set());
  const [transferSelectedModalOpen, setTransferSelectedModalOpen] = useState(false);
  const [transferSelectedFacilities, setTransferSelectedFacilities] = useState([]);
  const [transferSelectedTargetId, setTransferSelectedTargetId] = useState('');
  const [transferSelectedSubmitting, setTransferSelectedSubmitting] = useState(false);
  const [transferSelectedError, setTransferSelectedError] = useState('');
  const [transferSelectedSuccess, setTransferSelectedSuccess] = useState('');

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
        
        // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
        // Load facility information
        const { data: facilityData, error: facilityError } = await supabase
          .from('facilities')
          .select('*')
          .eq('id', facilityId)
          .maybeSingle();
        
        if (facilityError) {
          throw new Error(`Failed to fetch facility: ${facilityError.message}`);
        }
        
        if (facilityData) {
          setFacility(facilityData);
          console.log('✅ Facility loaded:', facilityData);
        } else {
          console.log('❌ Facility not found, redirecting to first available facility');
          // Try to redirect to the first available facility instead of management
          const { data: facilities, error: facilitiesError } = await supabase
            .from('facilities')
            .select('*')
            .limit(1);
          
          if (!facilitiesError && facilities && facilities.length > 0) {
            console.log('🔄 Redirecting to first available facility:', facilities[0].id);
            history.push(`/app/facility/${facilities[0].id}`);
            return;
          }
          
          // Fallback to management if no facilities found
          console.log('🔄 No facilities found, redirecting to facility management');
          history.push('/app/facility/management');
          return;
        }
        
        // Load clients for this facility
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('facility_id', facilityId)
          .limit(100);
        
        if (clientsError) {
          throw new Error(`Failed to fetch clients: ${clientsError.message}`);
        }
        const clientsList = clientsData || [];
        setClients(clientsList);
        console.log('✅ Clients loaded:', clientsList);
        
        // Load signed URLs for profile photos
        if (clientsList.length > 0) {
          const photoUrlPromises = clientsList
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
        }
        
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

  const normalizedSearch = (searchTerm || '').trim().toLowerCase();
  const filteredClients = (clients || []).filter((client) => {
    if (!client) return false;
    const firstName = (client.first_name || '').trim();
    const lastName = (client.last_name || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    // When there's no search term, show all clients in the facility (even if name fields are blank).
    if (!normalizedSearch) return true;

    // When searching, match against name (and room as a convenience).
    const room = (client.room || '').trim();
    const haystack = `${fullName} ${room}`.trim().toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const handleViewClient = (client) => {
    history.push(`/app/client/${client.id}`);
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

  const handleCreateNewClient = () => {
    if (!facilityId) {
      console.error('❌ No facilityId available');
      alert('Error: Facility ID is missing. Please try again.');
      return;
    }
    history.push(`/app/client/new/edit?facility=${facilityId}`);
  };

  const handleOpenAddClientModal = async () => {
    setAddClientModalOpen(true);
    setTransferModalLoading(true);
    setTransferError('');
    setSelectedTransferIds(new Set());
    setTransferTarget('this');
    setSelectedTransferFacilityId('');
    try {
      const [clientsRes, facilitiesRes] = await Promise.all([
        supabase.from('clients').select('id, first_name, last_name, facility_id, facilities(id, name)').limit(500),
        supabase.from('facilities').select('id, name').order('name', { ascending: true })
      ]);
      if (clientsRes.error) throw new Error(clientsRes.error.message);
      if (facilitiesRes.error) throw new Error(facilitiesRes.error.message);
      setAllClientsForTransfer(clientsRes.data || []);
      const facList = facilitiesRes.data || [];
      setFacilitiesList(facList);
      setSelectedTransferFacilityId(facList[0]?.id || '');
    } catch (err) {
      console.error('Error loading data for Add Client modal:', err);
      setTransferError(err.message || 'Failed to load clients and facilities.');
    } finally {
      setTransferModalLoading(false);
    }
  };

  const handleCloseAddClientModal = () => {
    setAddClientModalOpen(false);
    setAllClientsForTransfer([]);
    setFacilitiesList([]);
    setSelectedTransferIds(new Set());
    setTransferSuccessMessage('');
    setTransferError('');
  };

  const handleToggleTransferClient = (clientId) => {
    setSelectedTransferIds(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const handleSelectAllTransfer = () => {
    setSelectedTransferIds(new Set(allClientsForTransfer.map(c => c.id)));
  };

  const handleDeselectAllTransfer = () => {
    setSelectedTransferIds(new Set());
  };

  const getTargetFacilityId = () => {
    if (transferTarget === 'this') return facilityId;
    return selectedTransferFacilityId || null;
  };

  const handleConfirmTransfer = async () => {
    const targetId = getTargetFacilityId();
    if (!targetId || selectedTransferIds.size === 0) {
      setTransferError(transferTarget === 'this' ? 'Please select at least one client.' : 'Please select a facility and at least one client.');
      return;
    }
    setTransferSubmitting(true);
    setTransferError('');
    try {
      const { error } = await supabase
        .from('clients')
        .update({ facility_id: targetId, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedTransferIds));
      if (error) throw error;
      const count = selectedTransferIds.size;
      setTransferSuccessMessage(`${count} client${count !== 1 ? 's' : ''} transferred successfully.`);
      setSelectedTransferIds(new Set());
      // Reload current facility's clients if we're on this facility
      if (targetId === facilityId) {
        const { data } = await supabase.from('clients').select('*').eq('facility_id', facilityId);
        setClients(data || []);
      }
      setTimeout(() => {
        handleCloseAddClientModal();
      }, 1500);
    } catch (err) {
      console.error('Error transferring clients:', err);
      setTransferError(err.message || 'Failed to transfer clients.');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleToggleClientForTransfer = (clientId) => {
    setSelectedClientsInFacility(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const handleSelectAllInFacility = () => {
    setSelectedClientsInFacility(new Set(filteredClients.map(c => c.id)));
  };

  const handleDeselectAllInFacility = () => {
    setSelectedClientsInFacility(new Set());
  };

  const handleOpenTransferSelectedModal = async () => {
    if (selectedClientsInFacility.size === 0) return;
    setTransferSelectedModalOpen(true);
    setTransferSelectedError('');
    setTransferSelectedSuccess('');
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      const list = (data || []).filter(f => f.id !== facilityId);
      setTransferSelectedFacilities(list);
      setTransferSelectedTargetId(list[0]?.id || '');
    } catch (err) {
      console.error('Error loading facilities for transfer:', err);
      setTransferSelectedError(err.message || 'Failed to load facilities.');
    }
  };

  const handleCloseTransferSelectedModal = () => {
    setTransferSelectedModalOpen(false);
    setSelectedClientsInFacility(new Set());
    setTransferSelectedFacilities([]);
    setTransferSelectedTargetId('');
    setTransferSelectedError('');
    setTransferSelectedSuccess('');
  };

  const handleConfirmTransferSelected = async () => {
    if (selectedClientsInFacility.size === 0 || !transferSelectedTargetId) return;
    setTransferSelectedSubmitting(true);
    setTransferSelectedError('');
    try {
      const { error } = await supabase
        .from('clients')
        .update({ facility_id: transferSelectedTargetId, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedClientsInFacility));
      if (error) throw error;
      const count = selectedClientsInFacility.size;
      setTransferSelectedSuccess(`${count} client${count !== 1 ? 's' : ''} transferred successfully.`);
      const { data } = await supabase.from('clients').select('*').eq('facility_id', facilityId);
      setClients(data || []);
      setSelectedClientsInFacility(new Set());
      setTimeout(handleCloseTransferSelectedModal, 1500);
    } catch (err) {
      console.error('Error transferring selected clients:', err);
      setTransferSelectedError(err.message || 'Failed to transfer clients.');
    } finally {
      setTransferSelectedSubmitting(false);
    }
  };

  const handleCreateReport = (client) => {
    setSelectedClient(client);
    setReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
    setSelectedClient(null);
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
                  <Box display="flex" gap={1} alignItems="center">
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<TransferIcon />}
                      onClick={handleOpenTransferSelectedModal}
                      disabled={selectedClientsInFacility.size === 0}
                    >
                      Transfer selected {selectedClientsInFacility.size > 0 ? `(${selectedClientsInFacility.size})` : ''}
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PersonAddIcon />}
                      onClick={handleOpenAddClientModal}
                    >
                      Add Client
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleCreateNewClient}
                    >
                      Create a new client
                    </Button>
                  </Box>
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
              
              {isAdmin && selectedClientsInFacility.size > 0 && (
                <Box display="flex" gap={1} alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    {selectedClientsInFacility.size} selected
                  </Typography>
                  <Button size="small" onClick={handleSelectAllInFacility}>Select all</Button>
                  <Button size="small" onClick={handleDeselectAllInFacility}>Deselect all</Button>
                </Box>
              )}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {isAdmin && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedClientsInFacility.size > 0 && selectedClientsInFacility.size < filteredClients.length}
                            checked={filteredClients.length > 0 && selectedClientsInFacility.size === filteredClients.length}
                            onChange={(e) => e.target.checked ? handleSelectAllInFacility() : handleDeselectAllInFacility()}
                          />
                        </TableCell>
                      )}
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
                          {isAdmin && (
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedClientsInFacility.has(client.id)}
                                onChange={() => handleToggleClientForTransfer(client.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <Avatar
                              sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                              src={clientPhotoUrls[client.id]}
                            >
                              {clientPhotoUrls[client.id]
                                ? null
                                : `${(client.first_name || '').trim()[0] || '?'}${(client.last_name || '').trim()[0] || ''}`}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
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
                              {`${(client.first_name || '').trim()} ${(client.last_name || '').trim()}`.trim() ||
                                'Unnamed client'}
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
                                  onClick={() => handleCreateReport(client)}
                                  color="success"
                                >
                                  <ReportIcon />
                                </IconButton>
                              </Tooltip>
                              {isAdmin && (
                                <Tooltip title="Delete Client">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDeleteClient(client.id)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 7 : 6} align="center">
                          <Typography variant="body2" color="textSecondary">
                            {searchTerm ? 'No clients found matching your search.' : isAdmin ? 'No clients in this facility. Use "Add Client" to transfer clients here or "Create a new client" to add one.' : 'No clients in this facility.'}
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

      {/* Add Client (transfer) Modal */}
      <Dialog
        open={addClientModalOpen}
        onClose={shieldEntityDialogClose(handleCloseAddClientModal)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        disableEscapeKeyDown
      >
        <DialogTitle>Add Client – Transfer to facility</DialogTitle>
        <DialogContent>
          {transferModalLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              {transferError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTransferError('')}>
                  {transferError}
                </Alert>
              )}
              {transferSuccessMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>{transferSuccessMessage}</Alert>
              )}
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Select clients to transfer, then choose the destination facility.
              </Typography>
              <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Transfer selected clients to:</Typography>
                <RadioGroup
                  row
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                >
                  <FormControlLabel value="this" control={<Radio />} label={`This facility (${facility?.name || 'current'})`} />
                  <FormControlLabel value="other" control={<Radio />} label="A different facility" />
                </RadioGroup>
              </FormControl>
              {transferTarget === 'other' && (
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Facility</InputLabel>
                  <Select
                    value={selectedTransferFacilityId}
                    label="Facility"
                    onChange={(e) => setSelectedTransferFacilityId(e.target.value)}
                  >
                    {facilitiesList.map((f) => (
                      <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">Clients ({allClientsForTransfer.length})</Typography>
                <Box>
                  <Button size="small" onClick={handleSelectAllTransfer}>Select all</Button>
                  <Button size="small" onClick={handleDeselectAllTransfer}>Deselect all</Button>
                </Box>
              </Box>
              <List dense sx={{ maxHeight: 320, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {allClientsForTransfer.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No clients found." />
                  </ListItem>
                ) : (
                  allClientsForTransfer.map((client) => {
                    const facilityName = client.facilities?.name ?? (client.facility_id ? 'Unknown' : 'No facility');
                    return (
                      <ListItem key={client.id} disablePadding>
                        <ListItemButton dense onClick={() => handleToggleTransferClient(client.id)}>
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={selectedTransferIds.has(client.id)}
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed'}
                            secondary={facilityName}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })
                )}
              </List>
              {selectedTransferIds.size > 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {selectedTransferIds.size} client{selectedTransferIds.size !== 1 ? 's' : ''} selected
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddClientModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmTransfer}
            disabled={transferModalLoading || transferSubmitting || selectedTransferIds.size === 0 || (transferTarget === 'other' && !selectedTransferFacilityId)}
          >
            {transferSubmitting ? 'Transferring…' : 'Transfer selected'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer selected (clients in this facility) Modal */}
      <Dialog
        open={transferSelectedModalOpen}
        onClose={shieldEntityDialogClose(handleCloseTransferSelectedModal)}
        maxWidth="xs"
        fullWidth
        disableEnforceFocus
        disableEscapeKeyDown
      >
        <DialogTitle>Transfer selected clients</DialogTitle>
        <DialogContent>
          {transferSelectedError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTransferSelectedError('')}>
              {transferSelectedError}
            </Alert>
          )}
          {transferSelectedSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>{transferSelectedSuccess}</Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Transfer {selectedClientsInFacility.size} client{selectedClientsInFacility.size !== 1 ? 's' : ''} to:
          </Typography>
          {transferSelectedFacilities.length === 0 ? (
            <Typography variant="body2" color="textSecondary">No other facilities available.</Typography>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Facility</InputLabel>
              <Select
                value={transferSelectedTargetId}
                label="Facility"
                onChange={(e) => setTransferSelectedTargetId(e.target.value)}
              >
                {transferSelectedFacilities.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransferSelectedModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmTransferSelected}
            disabled={transferSelectedFacilities.length === 0 || !transferSelectedTargetId || transferSelectedSubmitting}
          >
            {transferSelectedSubmitting ? 'Transferring…' : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Selection Modal */}
      <DateSelectionModal
        open={reportModalOpen}
        onClose={handleCloseReportModal}
        client={selectedClient}
        facilityId={facilityId}
      />
    </Box>
  );
}

export default FacilityPage;