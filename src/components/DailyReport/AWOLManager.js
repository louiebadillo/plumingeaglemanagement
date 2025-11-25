import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { uploadFile, deleteFile, getFileUrl } from '../../utils/fileUpload';

const AWOL_STATUS_OPTIONS = [
  { value: 'late return', label: 'Late return' },
  { value: 'reported to agency', label: 'Reported to agency' },
  { value: 'escalated to NEP', label: 'Escalated to NEP' },
  { value: 'Still AWOL', label: 'Still AWOL' },
  { value: 'returned from AWOL', label: 'Returned from AWOL' }
];

function AWOLManager({ awolIncidents = [], onUpdate, canEdit, userId, clientId, reportDate }) {
  const [open, setOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [awolForm, setAwolForm] = useState({
    status: '',
    remarks: '',
    files: []
  });

  const handleAddIncident = () => {
    setEditingIncident(null);
    setAwolForm({
      status: '',
      remarks: '',
      files: []
    });
    setOpen(true);
  };

  const handleEditIncident = (incident) => {
    setEditingIncident(incident);
    setAwolForm({
      status: incident.status || '',
      remarks: incident.remarks || '',
      files: incident.files || []
    });
    setOpen(true);
  };

  const handleSaveIncident = () => {
    if (!awolForm.status) {
      alert('Please select AWOL status');
      return;
    }

    const incidentData = {
      id: editingIncident?.id || `awol-${Date.now()}`,
      status: awolForm.status,
      remarks: awolForm.remarks,
      files: awolForm.files,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };

    const updatedIncidents = editingIncident
      ? awolIncidents.map(inc => inc.id === editingIncident.id ? incidentData : inc)
      : [...awolIncidents, incidentData];

    onUpdate(updatedIncidents);
    setOpen(false);
  };

  const handleDeleteIncident = (incidentId) => {
    if (window.confirm('Are you sure you want to delete this AWOL incident?')) {
      const updatedIncidents = awolIncidents.filter(inc => inc.id !== incidentId);
      onUpdate(updatedIncidents);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileData = await uploadFile(file, clientId, 'awol', reportDate);
      setAwolForm(prev => ({
        ...prev,
        files: [...prev.files, fileData]
      }));
    } catch (error) {
      console.error('File upload error:', error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileIndex) => {
    const fileToDelete = awolForm.files[fileIndex];
    try {
      await deleteFile(fileToDelete.path, 'awol');
      setAwolForm(prev => ({
        ...prev,
        files: prev.files.filter((_, index) => index !== fileIndex)
      }));
    } catch (error) {
      console.error('File deletion error:', error);
      alert(`Failed to delete file: ${error.message}`);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const url = await getFileUrl(file.path, 'awol');
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">AWOL Report</Typography>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddIncident}
            size="small"
          >
            Add AWOL Incident
          </Button>
        )}
      </Box>

      {awolIncidents.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No AWOL incidents recorded
        </Typography>
      ) : (
        <List>
          {awolIncidents.map((incident, index) => (
            <React.Fragment key={incident.id || index}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="subtitle2">
                        {AWOL_STATUS_OPTIONS.find(opt => opt.value === incident.status)?.label || incident.status}
                      </Typography>
                      {incident.remarks && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {incident.remarks}
                        </Typography>
                      )}
                      {incident.files && incident.files.length > 0 && (
                        <Box mt={1}>
                          <Typography variant="caption" color="textSecondary">
                            Files: {incident.files.length}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      Updated: {new Date(incident.updatedAt).toLocaleString()}
                    </Typography>
                  }
                />
                {canEdit && (
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditIncident(incident)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteIncident(incident.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < awolIncidents.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* AWOL Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIncident ? 'Edit AWOL Incident' : 'Add AWOL Incident'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>AWOL Status</InputLabel>
                <Select
                  value={awolForm.status}
                  label="AWOL Status"
                  onChange={(e) => setAwolForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  {AWOL_STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={3}
                value={awolForm.remarks}
                onChange={(e) => setAwolForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Provide additional details about the AWOL incident..."
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <input
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: 'none' }}
                  id="awol-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="awol-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={uploading ? <CircularProgress size={20} /> : <AttachFileIcon />}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </label>
                <Typography variant="caption" color="textSecondary">
                  PDF, JPG, PNG, DOC, DOCX (max 10MB)
                </Typography>
              </Box>
            </Grid>

            {awolForm.files.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Files:
                </Typography>
                <List dense>
                  {awolForm.files.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={file.name}
                        secondary={new Date(file.uploadedAt).toLocaleString()}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Download">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDownloadFile(file)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton 
                            size="small" 
                            onClick={() => handleFileDelete(index)}
                            color="error"
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveIncident} 
            variant="contained"
          >
            {editingIncident ? 'Update' : 'Add'} AWOL Incident
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AWOLManager;

