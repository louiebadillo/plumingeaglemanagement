import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeletePhotoIcon
} from '@mui/icons-material';

// Mock staff data - in a real app, this would come from the database
const mockStaff = [
  {
    id: 1,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@plumingeagle.com',
    role: 'employee',
    status: 'active',
    phone: '(555) 123-4567',
    hireDate: '2023-01-15',
    lastLogin: '2024-01-15T08:30:00Z',
    avatar: null,
    username: 'sarah.johnson',
    password: 'temp123' // In real app, this would be hashed
  },
  {
    id: 2,
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@plumingeagle.com',
    role: 'employee',
    status: 'active',
    phone: '(555) 234-5678',
    hireDate: '2023-03-20',
    lastLogin: '2024-01-14T16:45:00Z',
    avatar: null,
    username: 'mike.chen',
    password: 'temp123'
  },
  {
    id: 3,
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@plumingeagle.com',
    role: 'employee',
    status: 'active',
    phone: '(555) 345-6789',
    hireDate: '2023-06-10',
    lastLogin: '2024-01-15T09:15:00Z',
    avatar: null,
    username: 'emily.davis',
    password: 'temp123'
  },
  {
    id: 4,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@plumingeagle.com',
    role: 'admin',
    status: 'active',
    phone: '(555) 000-0000',
    hireDate: '2023-01-01',
    lastLogin: '2024-01-15T10:00:00Z',
    avatar: null,
    username: 'admin',
    password: 'admin123'
  }
];

function StaffManagement() {
  const [staff, setStaff] = useState(mockStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'employee',
    phone: '',
    status: 'active',
    avatar: null
  });

  const filteredStaff = staff.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      role: 'employee',
      phone: '',
      status: 'active',
      avatar: null
    });
    setOpenDialog(true);
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      username: staffMember.username,
      password: '', // Don't show existing password
      role: staffMember.role,
      phone: staffMember.phone,
      status: staffMember.status,
      avatar: staffMember.avatar
    });
    setOpenDialog(true);
  };

  const handleDeleteStaff = (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      setStaff(staff.filter(member => member.id !== staffId));
    }
  };

  const handleSaveStaff = () => {
    if (editingStaff) {
      // Update existing staff
      setStaff(staff.map(member => 
        member.id === editingStaff.id 
          ? { 
              ...member, 
              ...formData,
              password: formData.password || member.password // Keep existing password if not changed
            }
          : member
      ));
    } else {
      // Add new staff
      const newStaff = {
        id: Math.max(...staff.map(s => s.id)) + 1,
        ...formData,
        hireDate: new Date().toISOString().split('T')[0],
        lastLogin: null,
        avatar: null
      };
      setStaff([...staff, newStaff]);
    }
    setOpenDialog(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'employee': return 'primary';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      default: return 'default';
    }
  };

  const generateUsername = (firstName, lastName) => {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setUploadingImage(true);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, avatar: e.target.result });
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, avatar: null });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Staff Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage staff members, roles, and access credentials
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddStaff}
          color="primary"
        >
          Add Staff Member
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name, email, or username"
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
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Staff Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Staff Members ({filteredStaff.length})
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Hire Date</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar 
                            src={member.avatar} 
                            sx={{ width: 40, height: 40 }}
                          >
                            {member.firstName[0]}{member.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {member.firstName} {member.lastName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              @{member.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {member.email}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {member.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.role.charAt(0).toUpperCase() + member.role.slice(1)} 
                          color={getRoleColor(member.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.status.charAt(0).toUpperCase() + member.status.slice(1)} 
                          color={getStatusColor(member.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(member.hireDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {member.lastLogin 
                            ? new Date(member.lastLogin).toLocaleString()
                            : 'Never'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit Staff">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditStaff(member)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Staff">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteStaff(member.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No staff members found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Profile Picture Upload */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={3} sx={{ mb: 2 }}>
                <Avatar 
                  src={formData.avatar} 
                  sx={{ width: 80, height: 80 }}
                >
                  {formData.firstName[0]}{formData.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Profile Picture
                  </Typography>
                  <Box display="flex" gap={1}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-picture-upload"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="profile-picture-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={uploadingImage ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                        disabled={uploadingImage}
                        size="small"
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                      </Button>
                    </label>
                    {formData.avatar && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeletePhotoIcon />}
                        onClick={handleRemoveImage}
                        size="small"
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    JPG, PNG or GIF. Max size 5MB.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => {
                  const firstName = e.target.value;
                  setFormData({
                    ...formData,
                    firstName,
                    username: editingStaff ? formData.username : generateUsername(firstName, formData.lastName)
                  });
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => {
                  const lastName = e.target.value;
                  setFormData({
                    ...formData,
                    lastName,
                    username: editingStaff ? formData.username : generateUsername(formData.firstName, lastName)
                  });
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <HideIcon /> : <ViewIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText={editingStaff ? "Leave blank to keep current password" : "Required for new staff"}
                required={!editingStaff}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {!editingStaff && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Login Credentials:</strong> Username: {formData.username} | 
                    Password: {formData.password || 'Will be generated'}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          {!editingStaff && (
            <Button 
              onClick={() => setFormData({ ...formData, password: generatePassword() })}
              color="secondary"
            >
              Generate Password
            </Button>
          )}
          <Button onClick={handleSaveStaff} variant="contained">
            {editingStaff ? 'Update' : 'Create'} Staff Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StaffManagement;
