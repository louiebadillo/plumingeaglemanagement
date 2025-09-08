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
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Announcement as AnnouncementIcon
} from '@mui/icons-material';

// Mock announcements data - in a real app, this would come from the database
const mockAnnouncements = [
  {
    id: 1,
    title: 'Staff Meeting Reminder',
    message: 'Weekly staff meeting tomorrow at 2:00 PM in the conference room.',
    type: 'info',
    priority: 'medium',
    createdAt: '2024-01-15T10:00:00Z',
    createdBy: 'Admin User',
    isActive: true
  },
  {
    id: 2,
    title: 'New Client Admission',
    message: 'Please review the care plan for the new client arriving next week.',
    type: 'success',
    priority: 'high',
    createdAt: '2024-01-14T14:30:00Z',
    createdBy: 'Admin User',
    isActive: true
  },
  {
    id: 3,
    title: 'Policy Update',
    message: 'Updated medication administration procedures are now in effect.',
    type: 'warning',
    priority: 'high',
    createdAt: '2024-01-12T09:15:00Z',
    createdBy: 'Admin User',
    isActive: true
  },
  {
    id: 4,
    title: 'Holiday Schedule',
    message: 'Updated holiday schedule for next month is now available.',
    type: 'info',
    priority: 'low',
    createdAt: '2024-01-10T16:45:00Z',
    createdBy: 'Admin User',
    isActive: false
  }
];

function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    isActive: true
  });

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && announcement.isActive) ||
                         (statusFilter === 'inactive' && !announcement.isActive);
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      isActive: true
    });
    setOpenDialog(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      priority: announcement.priority,
      isActive: announcement.isActive
    });
    setOpenDialog(true);
  };

  const handleDeleteAnnouncement = (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(announcements.filter(announcement => announcement.id !== announcementId));
    }
  };

  const handleSaveAnnouncement = () => {
    if (editingAnnouncement) {
      // Update existing announcement
      setAnnouncements(announcements.map(announcement => 
        announcement.id === editingAnnouncement.id 
          ? { 
              ...announcement, 
              ...formData,
              updatedAt: new Date().toISOString()
            }
          : announcement
      ));
    } else {
      // Add new announcement
      const newAnnouncement = {
        id: Math.max(...announcements.map(a => a.id)) + 1,
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin User'
      };
      setAnnouncements([...announcements, newAnnouncement]);
    }
    setOpenDialog(false);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'info': return 'primary';
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Announcements Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and manage announcements for all staff members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAnnouncement}
          color="primary"
        >
          Create Announcement
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search announcements"
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
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
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

      {/* Announcements Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Announcements ({filteredAnnouncements.length})
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {announcement.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {announcement.message.length > 100 
                            ? `${announcement.message.substring(0, 100)}...`
                            : announcement.message
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)} 
                          color={getTypeColor(announcement.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} 
                          color={getPriorityColor(announcement.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={announcement.isActive ? 'Active' : 'Inactive'} 
                          color={getStatusColor(announcement.isActive)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {formatDate(announcement.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit Announcement">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditAnnouncement(announcement)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Announcement">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
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
                        No announcements found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Announcement Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.isActive}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAnnouncement} variant="contained">
            {editingAnnouncement ? 'Update' : 'Create'} Announcement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AnnouncementsManagement;
