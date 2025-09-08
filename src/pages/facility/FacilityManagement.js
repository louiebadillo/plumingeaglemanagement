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
  DialogActions
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { getCurrentUserRole } from '../../components/Sidebar/getSidebarStructure';

// Mock facility data - in a real app, this would come from a database
const mockFacilities = [
  {
    id: 'facility-a',
    name: 'Facility A',
    description: 'Group Home - Main House',
    address: '123 Main Street, City, State 12345'
  },
  {
    id: 'facility-b',
    name: 'Facility B',
    description: 'Group Home - Transition House',
    address: '456 Oak Avenue, City, State 12345'
  },
  {
    id: 'facility-c',
    name: 'Facility C',
    description: 'Group Home - Specialized Care',
    address: '789 Pine Road, City, State 12345'
  }
];

function FacilityManagement() {
  const history = useHistory();
  const [facilities, setFacilities] = useState(mockFacilities);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [isNewFacility, setIsNewFacility] = useState(false);

  const userRole = getCurrentUserRole();
  const isAdmin = userRole === 'admin';

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditFacility = (facility) => {
    setEditingFacility(facility);
    setIsNewFacility(false);
    setEditDialogOpen(true);
  };

  const handleAddFacility = () => {
    setEditingFacility({
      id: '',
      name: '',
      description: '',
      address: ''
    });
    setIsNewFacility(true);
    setEditDialogOpen(true);
  };

  const handleDeleteFacility = (facilityId) => {
    if (window.confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
      setFacilities(facilities.filter(facility => facility.id !== facilityId));
      alert('Facility deleted successfully!');
    }
  };

  const handleSaveFacility = () => {
    if (!editingFacility.name.trim()) {
      alert('Please enter a facility name.');
      return;
    }

    if (isNewFacility) {
      // Generate new ID for new facility
      const newId = `facility-${facilities.length + 1}`;
      const newFacility = {
        ...editingFacility,
        id: newId
      };
      setFacilities([...facilities, newFacility]);
      alert('Facility added successfully!');
    } else {
      // Update existing facility
      setFacilities(facilities.map(facility => 
        facility.id === editingFacility.id ? editingFacility : facility
      ));
      alert('Facility updated successfully!');
    }

    setEditDialogOpen(false);
    setEditingFacility(null);
  };

  const handleInputChange = (field, value) => {
    setEditingFacility({
      ...editingFacility,
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
                      <TableCell>Description</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFacilities.length > 0 ? (
                      filteredFacilities.map((facility) => (
                        <TableRow key={facility.id}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {facility.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{facility.description}</TableCell>
                          <TableCell>{facility.address}</TableCell>
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
                value={editingFacility?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editingFacility?.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={editingFacility?.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveFacility} variant="contained" color="primary">
            {isNewFacility ? 'Add Facility' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FacilityManagement;
