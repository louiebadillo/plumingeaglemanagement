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
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';

// Initial form data for creating/editing facilities
const initialFormData = {
  name: '',
  address: '',
  phone: '',
  description: ''
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
      description: facility.description || ''
    });
    setIsNewFacility(false);
    setEditDialogOpen(true);
  };

  const handleAddFacility = () => {
    setEditingFacility(null);
    setFormData(initialFormData);
    setIsNewFacility(true);
    setEditDialogOpen(true);
  };

  const handleDeleteFacility = async (facilityId) => {
    if (window.confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
      try {
        console.log('🗑️ Deleting facility:', facilityId);
        
        // Use direct fetch with service role key for deletion
        const response = await fetch(`${supabaseUrl}/rest/v1/facilities?id=eq.${facilityId}`, {
          method: 'DELETE',
          headers: getSupabaseHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Update local state
        setFacilities(facilities.filter(facility => facility.id !== facilityId));
        console.log('✅ Facility deleted successfully!');
        alert('Facility deleted successfully from Supabase!');
      } catch (error) {
        console.error('💥 Error deleting facility:', error);
        alert('Error deleting facility: ' + error.message);
      }
    }
  };

  const handleSaveFacility = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a facility name.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('💾 Saving facility:', formData);

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
          const reloadResponse = await fetch('${supabaseUrl}/rest/v1/facilities?select=*', {
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
        
        alert('Facility created successfully in Supabase!');
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
        alert('Facility updated successfully in Supabase!');
      }
    } catch (error) {
      console.error('💥 Error saving facility:', error);
      alert('Error saving facility: ' + error.message);
    } finally {
      setSubmitting(false);
      setEditDialogOpen(false);
      setEditingFacility(null);
      setFormData(initialFormData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
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
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
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
                                onClick={() => handleDeleteFacility(facility.id)}
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
                        <TableCell colSpan={4} align="center">
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
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>
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
    </Box>
  );
}

export default FacilityManagement;
