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

const APPOINTMENT_TYPES = {
  health: {
    types: ['Initial', 'Annual', 'Routine', 'Walk-in', 'Scheduled'],
    natures: ['medical', 'dental', 'optical', 'developmental', 'psychological/therapy']
  },
  'non-health': {
    types: ['family', 'caseworker', 'youth worker', 'legal', 'social', 'cultural', 'school', 'community outing', 'recreation', 'independent outgoing', 'others']
  }
};

const COMPLIANCE_OPTIONS = [
  { value: 'attended', label: 'Attended (1pt)' },
  { value: 'refused', label: 'Refused (0pt)' },
  { value: 'rescheduled', label: 'Rescheduled (0pt)' },
  { value: 'cancelled', label: 'Cancelled (0pt)' }
];

function AppointmentsManager({ appointments = [], onUpdate, canEdit, userId, clientId, reportDate }) {
  const [open, setOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    type: 'health',
    appointmentType: '',
    nature: '',
    socialType: '',
    compliance: '',
    remarks: '',
    files: []
  });

  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setAppointmentForm({
      type: 'health',
      appointmentType: '',
      nature: '',
      socialType: '',
      compliance: '',
      remarks: '',
      files: []
    });
    setOpen(true);
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setAppointmentForm({
      type: appointment.type,
      appointmentType: appointment.appointmentType || '',
      nature: appointment.nature || '',
      socialType: appointment.socialType || '',
      compliance: appointment.compliance || '',
      remarks: appointment.remarks || '',
      files: appointment.files || []
    });
    setOpen(true);
  };

  const handleSaveAppointment = () => {
    const appointmentData = {
      id: editingAppointment?.id || `appt-${Date.now()}`,
      type: appointmentForm.type,
      ...(appointmentForm.type === 'health' 
        ? { appointmentType: appointmentForm.appointmentType, nature: appointmentForm.nature }
        : { socialType: appointmentForm.socialType }
      ),
      compliance: appointmentForm.compliance,
      remarks: appointmentForm.remarks,
      files: appointmentForm.files,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };

    let updatedAppointments;
    if (editingAppointment) {
      updatedAppointments = appointments.map(apt => 
        apt.id === editingAppointment.id ? appointmentData : apt
      );
    } else {
      updatedAppointments = [...appointments, appointmentData];
    }

    onUpdate(updatedAppointments);
    setOpen(false);
  };

  const handleDeleteAppointment = (appointmentId) => {
    const updatedAppointments = appointments.filter(apt => apt.id !== appointmentId);
    onUpdate(updatedAppointments);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('🔍 AppointmentsManager upload params:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      clientId,
      category: 'appointments',
      reportDate
    });

    setUploading(true);
    try {
      const fileData = await uploadFile(file, clientId, 'appointments', reportDate);
      setAppointmentForm(prev => ({
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
    const fileToDelete = appointmentForm.files[fileIndex];
    try {
      await deleteFile(fileToDelete.path, 'appointments');
      setAppointmentForm(prev => ({
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
      const url = await getFileUrl(file.path, 'appointments');
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  const getComplianceScore = (compliance) => {
    return compliance === 'attended' ? 1 : 0;
  };

  const getAppointmentTypeLabel = (appointment) => {
    if (appointment.type === 'health') {
      return `${appointment.appointmentType} - ${appointment.nature}`;
    } else {
      return appointment.socialType;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Appointments</Typography>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddAppointment}
            size="small"
          >
            Add Appointment
          </Button>
        )}
      </Box>

      {appointments.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No appointments recorded
        </Typography>
      ) : (
        <List>
          {appointments.map((appointment, index) => (
            <React.Fragment key={appointment.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="subtitle2">
                        {getAppointmentTypeLabel(appointment)}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        <Chip 
                          label={appointment.compliance} 
                          color={appointment.compliance === 'attended' ? 'success' : 'error'}
                          size="small"
                        />
                        <Chip 
                          label={`${getComplianceScore(appointment.compliance)}pt`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      {appointment.remarks && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {appointment.remarks}
                        </Typography>
                      )}
                      {appointment.files && appointment.files.length > 0 && (
                        <Box mt={1}>
                          <Typography variant="caption" color="textSecondary">
                            Files: {appointment.files.length}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      Updated: {new Date(appointment.updatedAt).toLocaleString()}
                    </Typography>
                  }
                />
                {canEdit && (
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < appointments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Appointment Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAppointment ? 'Edit Appointment' : 'Add Appointment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Appointment Type</InputLabel>
                <Select
                  value={appointmentForm.type}
                  label="Appointment Type"
                  onChange={(e) => setAppointmentForm(prev => ({ 
                    ...prev, 
                    type: e.target.value,
                    appointmentType: '',
                    nature: '',
                    socialType: ''
                  }))}
                >
                  <MenuItem value="health">Health-related</MenuItem>
                  <MenuItem value="non-health">Non-health-related</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {appointmentForm.type === 'health' ? (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={appointmentForm.appointmentType}
                      label="Type"
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentType: e.target.value }))}
                    >
                      {APPOINTMENT_TYPES.health.types.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Nature</InputLabel>
                    <Select
                      value={appointmentForm.nature}
                      label="Nature"
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, nature: e.target.value }))}
                    >
                      {APPOINTMENT_TYPES.health.natures.map(nature => (
                        <MenuItem key={nature} value={nature}>{nature}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={appointmentForm.socialType}
                    label="Type"
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, socialType: e.target.value }))}
                  >
                    {APPOINTMENT_TYPES['non-health'].types.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Compliance</InputLabel>
                <Select
                  value={appointmentForm.compliance}
                  label="Compliance"
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, compliance: e.target.value }))}
                >
                  {COMPLIANCE_OPTIONS.map(option => (
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
                value={appointmentForm.remarks}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, remarks: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <input
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
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

            {appointmentForm.files.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Files:
                </Typography>
                <List dense>
                  {appointmentForm.files.map((file, index) => (
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
            onClick={handleSaveAppointment} 
            variant="contained"
            disabled={!appointmentForm.compliance}
          >
            {editingAppointment ? 'Update' : 'Add'} Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AppointmentsManager;
