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

const INJURY_TYPE_OPTIONS = [
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
  { value: 'medical emergency', label: 'Medical Emergency' }
];

const PERPETRATOR_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'other client', label: 'Other Client' },
  { value: 'staff', label: 'Staff' },
  { value: 'unknown', label: 'Unknown' }
];

function InjuriesManager({ injuries = [], onUpdate, canEdit, userId, clientId, reportDate }) {
  const [open, setOpen] = useState(false);
  const [editingInjury, setEditingInjury] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [injuryForm, setInjuryForm] = useState({
    type: '',
    perpetrator: '',
    remarks: '',
    files: []
  });

  const handleAddInjury = () => {
    setEditingInjury(null);
    setInjuryForm({
      type: '',
      perpetrator: '',
      remarks: '',
      files: []
    });
    setOpen(true);
  };

  const handleEditInjury = (injury) => {
    setEditingInjury(injury);
    setInjuryForm({
      type: injury.type || '',
      perpetrator: injury.perpetrator || '',
      remarks: injury.remarks || '',
      files: injury.files || []
    });
    setOpen(true);
  };

  const handleSaveInjury = () => {
    if (!injuryForm.type) {
      alert('Please select injury type');
      return;
    }

    const injuryData = {
      id: editingInjury?.id || `injury-${Date.now()}`,
      type: injuryForm.type,
      perpetrator: injuryForm.perpetrator,
      remarks: injuryForm.remarks,
      files: injuryForm.files,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };

    const updatedInjuries = editingInjury
      ? injuries.map(inj => inj.id === editingInjury.id ? injuryData : inj)
      : [...injuries, injuryData];

    onUpdate(updatedInjuries);
    setOpen(false);
  };

  const handleDeleteInjury = (injuryId) => {
    if (window.confirm('Are you sure you want to delete this injury report?')) {
      const updatedInjuries = injuries.filter(inj => inj.id !== injuryId);
      onUpdate(updatedInjuries);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileData = await uploadFile(file, clientId, 'injury', reportDate);
      setInjuryForm(prev => ({
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
    const fileToDelete = injuryForm.files[fileIndex];
    try {
      await deleteFile(fileToDelete.path, 'injury');
      setInjuryForm(prev => ({
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
      const url = await getFileUrl(file.path, 'injury');
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
        <Typography variant="h6">Injuries Report</Typography>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddInjury}
            size="small"
          >
            Add Injury
          </Button>
        )}
      </Box>

      {injuries.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No injuries recorded
        </Typography>
      ) : (
        <List>
          {injuries.map((injury, index) => (
            <React.Fragment key={injury.id || index}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="subtitle2">
                        {INJURY_TYPE_OPTIONS.find(opt => opt.value === injury.type)?.label || injury.type}
                        {injury.perpetrator && (
                          <Chip 
                            label={`Perpetrator: ${PERPETRATOR_OPTIONS.find(opt => opt.value === injury.perpetrator)?.label || injury.perpetrator}`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      {injury.remarks && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {injury.remarks}
                        </Typography>
                      )}
                      {injury.files && injury.files.length > 0 && (
                        <Box mt={1}>
                          <Typography variant="caption" color="textSecondary">
                            Files: {injury.files.length}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      Updated: {new Date(injury.updatedAt).toLocaleString()}
                    </Typography>
                  }
                />
                {canEdit && (
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditInjury(injury)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteInjury(injury.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < injuries.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Injury Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInjury ? 'Edit Injury Report' : 'Add Injury Report'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type of Injury</InputLabel>
                <Select
                  value={injuryForm.type}
                  label="Type of Injury"
                  onChange={(e) => setInjuryForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  {INJURY_TYPE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Perpetrator</InputLabel>
                <Select
                  value={injuryForm.perpetrator}
                  label="Perpetrator"
                  onChange={(e) => setInjuryForm(prev => ({ ...prev, perpetrator: e.target.value }))}
                >
                  {PERPETRATOR_OPTIONS.map(option => (
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
                value={injuryForm.remarks}
                onChange={(e) => setInjuryForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Provide additional details about the injury..."
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <input
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: 'none' }}
                  id="injury-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="injury-file-upload">
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

            {injuryForm.files.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Files:
                </Typography>
                <List dense>
                  {injuryForm.files.map((file, index) => (
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
            onClick={handleSaveInjury} 
            variant="contained"
          >
            {editingInjury ? 'Update' : 'Add'} Injury
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default InjuriesManager;

