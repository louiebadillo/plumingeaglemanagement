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
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';
import { geocodeAddress } from '../../utils/geocoding';
import { Divider, Chip } from '@mui/material';
import GeofencingMap from '../../components/Facility/GeofencingMap';
import SuccessModal from '../../components/Modals/SuccessModal';
import DeleteConfirmModal from '../../components/Modals/DeleteConfirmModal';

// Initial form data for creating/editing facilities
const initialFormData = {
  name: '',
  address: '',
  phone: '',
  description: '',
  geofence_latitude: null,
  geofence_longitude: null,
  geofence_radius_meters: 100
};

function FacilityManagement() {
  const history = useHistory();
  const { userProfile } = useSupabase();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [isNewFacility, setIsNewFacility] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [geofencingAddress, setGeofencingAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const userRole = userProfile?.role || 'employee';
  const isAdmin = userRole === 'admin';

  // Load facilities from Supabase on component mount
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading facilities from Supabase...');
        
        // Use direct fetch since Supabase client might hang
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(`${supabaseUrl}/rest/v1/facilities?select=*`, {
        method: 'GET',
        headers: getSupabaseHeaders()
      });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const facilitiesData = await response.json();
        console.log('✅ Loaded facilities from Supabase:', facilitiesData);
        setFacilities(facilitiesData || []);
      } catch (error) {
        console.error('💥 Error loading facilities:', error);
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    };

    loadFacilities();
  }, []);

  const filteredFacilities = facilities.filter(facility =>
    facility && facility.name && facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (facility && facility.address && facility.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditFacility = (facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name || '',
      address: facility.address || '',
      phone: facility.phone || '',
      description: facility.description || '',
      geofence_latitude: facility.geofence_latitude || null,
      geofence_longitude: facility.geofence_longitude || null,
      geofence_radius_meters: facility.geofence_radius_meters || 100
    });
    setGeofencingAddress('');
    setGeocodingError(null);
    setIsNewFacility(false);
    setEditDialogOpen(true);
  };

  const handleAddFacility = () => {
    setEditingFacility(null);
    setFormData(initialFormData);
    setGeofencingAddress('');
    setGeocodingError(null);
    setIsNewFacility(true);
    setEditDialogOpen(true);
  };

  const handleDeleteFacility = (facility) => {
    setFacilityToDelete(facility);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!facilityToDelete) return;

    try {
      setDeleting(true);
      console.log('🗑️ Deleting facility:', facilityToDelete.id);
      const { supabaseUrl } = getSupabaseConfig();
      
      // Use direct fetch with service role key for deletion
      const response = await fetch(`${supabaseUrl}/rest/v1/facilities?id=eq.${facilityToDelete.id}`, {
        method: 'DELETE',
        headers: getSupabaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setFacilities(facilities.filter(facility => facility.id !== facilityToDelete.id));
      console.log('✅ Facility deleted successfully!');
      
      // Trigger a custom event to refresh facilities in sidebar
      window.dispatchEvent(new CustomEvent('facilitiesChanged'));
      
      // Close delete dialog and show success
      setDeleteDialogOpen(false);
      setFacilityToDelete(null);
      setSuccessMessage(`Facility "${facilityToDelete.name}" has been deleted successfully.`);
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('💥 Error deleting facility:', error);
      alert('Error deleting facility: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveFacility = async () => {
      if (!formData.name.trim()) {
      setGeocodingError('Please enter a facility name.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('💾 Saving facility:', formData);
      const { supabaseUrl } = getSupabaseConfig();

      if (isNewFacility) {
        // Create new facility
        console.log('🆕 Creating new facility...');
        const response = await fetch(`${supabaseUrl}/rest/v1/facilities`, {
          method: 'POST',
          headers: getSupabaseHeaders(),
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Supabase error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const responseText = await response.text();
        console.log('📝 Raw response:', responseText);
        
        let newFacility;
        try {
          newFacility = responseText ? JSON.parse(responseText) : [];
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          throw new Error(`Failed to parse response: ${parseError.message}`);
        }
        console.log('✅ Facility created successfully:', newFacility);
        
        // If Supabase returns empty array, reload facilities from database
        if (newFacility && newFacility.length > 0) {
          setFacilities([...facilities, newFacility[0]]);
        } else {
          // Reload all facilities from database to get the latest data
          console.log('🔄 Reloading facilities from database...');
          const reloadResponse = await fetch(`${supabaseUrl}/rest/v1/facilities?select=*`, {
            method: 'GET',
            headers: {
            ...getSupabaseHeaders()
            }
          });
          
          if (reloadResponse.ok) {
            const reloadedFacilities = await reloadResponse.json();
            console.log('✅ Reloaded facilities:', reloadedFacilities);
            setFacilities(reloadedFacilities || []);
          }
        }
        
        // Trigger a custom event to refresh facilities in sidebar
        window.dispatchEvent(new CustomEvent('facilitiesChanged'));
        
        // Close dialog and show success modal
        setEditDialogOpen(false);
        setEditingFacility(null);
        setFormData(initialFormData);
        setGeofencingAddress('');
        setGeocodingError(null);
        setSubmitting(false);
        setSuccessMessage(`Facility "${formData.name}" has been created successfully.`);
        setSuccessModalOpen(true);
      } else {
        // Update existing facility
        console.log('🔄 Updating existing facility:', editingFacility.id);
        const response = await fetch(`${supabaseUrl}/rest/v1/facilities?id=eq.${editingFacility.id}`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(),
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Supabase error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Update local state
        setFacilities(facilities.map(facility => 
          facility.id === editingFacility.id ? { ...facility, ...formData } : facility
        ));
        console.log('✅ Facility updated successfully!');
        
        // Trigger a custom event to refresh facilities in sidebar
        window.dispatchEvent(new CustomEvent('facilitiesChanged'));
        
        // Close dialog and show success modal
        setEditDialogOpen(false);
        setEditingFacility(null);
        setFormData(initialFormData);
        setGeofencingAddress('');
        setGeocodingError(null);
        setSubmitting(false);
        setSuccessMessage(`Facility "${formData.name}" has been updated successfully.`);
        setSuccessModalOpen(true);
      }
    } catch (error) {
      console.error('💥 Error saving facility:', error);
      alert('Error saving facility: ' + error.message);
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSetGeofencing = async () => {
    if (!geofencingAddress.trim()) {
      setGeocodingError('Please enter a geofencing address');
      return;
    }

    try {
      setGeocoding(true);
      setGeocodingError(null);
      
      const result = await geocodeAddress(geofencingAddress);
      
      if (result) {
        setFormData({
          ...formData,
          geofence_latitude: result.latitude,
          geofence_longitude: result.longitude
        });
        setGeocodingError(null);
        // Optionally show success message
        console.log('✅ Geofencing set successfully:', result);
      } else {
        setGeocodingError('Address not found. Please try a more specific address.');
      }
    } catch (error) {
      console.error('Error setting geofencing:', error);
      setGeocodingError(error.message || 'Failed to geocode address. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleClearGeofencing = () => {
    if (window.confirm('Are you sure you want to clear geofencing settings for this facility?')) {
      setFormData({
        ...formData,
        geofence_latitude: null,
        geofence_longitude: null,
        geofence_radius_meters: 100
      });
      setGeofencingAddress('');
      setGeocodingError(null);
    }
  };

  const hasGeofencing = (facility) => {
    return facility.geofence_latitude !== null && 
           facility.geofence_latitude !== undefined &&
           facility.geofence_longitude !== null && 
           facility.geofence_longitude !== undefined;
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You do not have permission to access facility management.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Facility Management
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Manage healthcare facilities, their information, and capacity
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Facilities ({filteredFacilities.length})</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddFacility}
                >
                  Add Facility
                </Button>
              </Box>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search facilities by name, description, or address"
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
                      <TableCell>Name</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Geofencing</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 2 }}>
                              Loading facilities from Supabase...
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : filteredFacilities.length > 0 ? (
                      filteredFacilities.map((facility) => (
                        facility && <TableRow key={facility.id}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {facility.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{facility.address || 'Not provided'}</TableCell>
                          <TableCell>{facility.phone || 'Not provided'}</TableCell>
                          <TableCell>{facility.description || 'Not provided'}</TableCell>
                          <TableCell>
                            <Tooltip 
                              title={
                                hasGeofencing(facility) 
                                  ? `Lat: ${facility.geofence_latitude}, Lng: ${facility.geofence_longitude}, Radius: ${facility.geofence_radius_meters || 100}m`
                                  : 'Geofencing not configured'
                              }
                            >
                              <Chip
                                label={hasGeofencing(facility) ? 'Configured' : 'Not Set'}
                                color={hasGeofencing(facility) ? 'success' : 'default'}
                                size="small"
                                icon={hasGeofencing(facility) ? <LocationIcon /> : null}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Edit Facility">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditFacility(facility)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Facility">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteFacility(facility)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="textSecondary">
                            {searchTerm ? 'No facilities found matching your search.' : 'No facilities available.'}
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

      {/* Edit/Add Facility Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => {
          if (!submitting) {
            setEditDialogOpen(false);
            setGeofencingAddress('');
            setGeocodingError(null);
          }
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {isNewFacility ? 'Add New Facility' : 'Edit Facility'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Facility Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                placeholder="Enter facility description (e.g., Group Home - Main House, Specialized Care, etc.)"
              />
            </Grid>

            {/* Geofencing Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Geofencing Settings
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Configure geofencing to automatically detect when employees are at this facility. Enter the facility address and set the detection radius.
              </Typography>

              {/* Current Geofencing Status */}
              {formData.geofence_latitude && formData.geofence_longitude && (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Geofencing Configured:</strong><br />
                      Latitude: {formData.geofence_latitude.toFixed(6)}<br />
                      Longitude: {formData.geofence_longitude.toFixed(6)}<br />
                      Radius: {formData.geofence_radius_meters || 100} meters
                    </Typography>
                  </Alert>
                  
                  {/* Map Visualization */}
                  <GeofencingMap
                    latitude={formData.geofence_latitude}
                    longitude={formData.geofence_longitude}
                    radius={formData.geofence_radius_meters || 100}
                    onLocationChange={(lat, lng) => {
                      setFormData({
                        ...formData,
                        geofence_latitude: lat,
                        geofence_longitude: lng
                      });
                    }}
                  />
                </>
              )}

              {/* Geofencing Address Input */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Geofencing Address"
                    value={geofencingAddress}
                    onChange={(e) => setGeofencingAddress(e.target.value)}
                    placeholder="Enter the facility address for geofencing (e.g., 123 Main St, City, State)"
                    helperText="Enter the exact address where employees will be working"
                    disabled={geocoding}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" gap={1} height="100%">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSetGeofencing}
                      disabled={geocoding || !geofencingAddress.trim()}
                      startIcon={geocoding ? <CircularProgress size={20} /> : <LocationIcon />}
                      sx={{ flex: 1 }}
                    >
                      {geocoding ? 'Setting...' : 'Set Geofencing'}
                    </Button>
                    {formData.geofence_latitude && formData.geofence_longitude && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleClearGeofencing}
                        startIcon={<ClearIcon />}
                      >
                        Clear
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {geocodingError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {geocodingError}
                </Alert>
              )}

              {/* Radius Input */}
              <TextField
                fullWidth
                type="number"
                label="Geofencing Radius (meters)"
                value={formData.geofence_radius_meters || 100}
                onChange={(e) => handleInputChange('geofence_radius_meters', parseInt(e.target.value) || 100)}
                helperText="Distance in meters from the facility address. Default: 100m. Typical values: 50-200m"
                inputProps={{ min: 10, step: 10 }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setEditDialogOpen(false);
              setGeofencingAddress('');
              setGeocodingError(null);
            }} 
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveFacility} 
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : (isNewFacility ? 'Add Facility' : 'Save Changes')}
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
          setFacilityToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Facility"
        itemName={facilityToDelete?.name}
        message={`Are you sure you want to delete the facility "${facilityToDelete?.name}"?`}
        warningMessage="This action cannot be undone. All associated data will be permanently removed."
        loading={deleting}
      />
    </Box>
  );
}

export default FacilityManagement;
