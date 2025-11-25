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
  Tooltip,
  Checkbox,
  FormControlLabel,
  FormGroup
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

const BIR_INCIDENT_TYPES = [
  'Physical aggression',
  'Unsafe behaviour',
  'Self-injury',
  'Stealing',
  'Property damage',
  'Technology violation',
  'Disruption/tantrum',
  'Verbal aggression',
  'Inappropriate language',
  'Inappropriate gestures',
  'Sexual behaviour',
  'Social withdrawal/isolation',
  'Attention-seeking behaviour',
  'Self-stimulatory/stereotypic behaviour',
  'Cheating',
  'Lying',
  'Racism',
  'Disrespect',
  'Bullying/harrassment',
  'Trouble sleeping',
  'Alcohol consumption',
  'Smoking cigarettes',
  'Smoking weed',
  'Non-compliance rules',
  'Picked up prohibited items',
  'Bringing prohibited items to GH'
];

function BIRManager({ birData = {}, onUpdate, canEdit, userId, clientId, reportDate }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [birForm, setBirForm] = useState({
    hasBIR: false,
    incidents: [],
    otherDescription: '',
    remarks: '',
    files: []
  });

  React.useEffect(() => {
    if (birData && Object.keys(birData).length > 0) {
      setBirForm({
        hasBIR: birData.hasBIR || false,
        incidents: birData.incidents || [],
        otherDescription: birData.otherDescription || '',
        remarks: birData.remarks || '',
        files: birData.files || []
      });
    }
  }, [birData]);

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleSaveBIR = () => {
    const updatedBirData = {
      hasBIR: birForm.hasBIR,
      incidents: birForm.incidents,
      otherDescription: birForm.otherDescription,
      remarks: birForm.remarks,
      files: birForm.files,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };

    onUpdate(updatedBirData);
    setOpen(false);
  };

  const handleIncidentToggle = (incidentType) => {
    setBirForm(prev => ({
      ...prev,
      incidents: prev.incidents.includes(incidentType)
        ? prev.incidents.filter(type => type !== incidentType)
        : [...prev.incidents, incidentType]
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileData = await uploadFile(file, clientId, 'bir', reportDate);
      setBirForm(prev => ({
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
    const fileToDelete = birForm.files[fileIndex];
    try {
      await deleteFile(fileToDelete.path, 'bir');
      setBirForm(prev => ({
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
      const url = await getFileUrl(file.path, 'bir');
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  const getBIRScore = () => {
    return birForm.hasBIR ? birForm.incidents.length : 0;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Overnight Report (BIR)</Typography>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleOpenDialog}
            size="small"
          >
            {birData.hasBIR ? 'Edit BIR' : 'Add BIR Report'}
          </Button>
        )}
      </Box>

      {!birData.hasBIR ? (
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No BIR incidents reported
        </Typography>
      ) : (
        <Card>
          <CardContent>
            <Box display="flex" gap={1} mb={2}>
              <Chip 
                label={`${birData.incidents?.length || 0} incidents`}
                color="error"
                size="small"
              />
              <Chip 
                label={`Score: ${getBIRScore()}`}
                variant="outlined"
                size="small"
              />
            </Box>
            
            {birData.incidents && birData.incidents.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Incident Types:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {birData.incidents.map((incident, index) => (
                    <Chip key={index} label={incident} size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {birData.otherDescription && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Other Description:
                </Typography>
                <Typography variant="body2">{birData.otherDescription}</Typography>
              </Box>
            )}

            {birData.remarks && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Remarks:
                </Typography>
                <Typography variant="body2">{birData.remarks}</Typography>
              </Box>
            )}

            {birData.files && birData.files.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Files ({birData.files.length}):
                </Typography>
                <List dense>
                  {birData.files.map((file, index) => (
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
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Typography variant="caption" color="textSecondary">
              Updated: {new Date(birData.updatedAt).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* BIR Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {birData.hasBIR ? 'Edit BIR Report' : 'Add BIR Report'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={birForm.hasBIR}
                    onChange={(e) => setBirForm(prev => ({ ...prev, hasBIR: e.target.checked }))}
                  />
                }
                label="BIR incidents occurred today"
              />
            </Grid>

            {birForm.hasBIR && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select incident types:
                  </Typography>
                  <Grid container spacing={2}>
                    {BIR_INCIDENT_TYPES.map(incidentType => (
                      <Grid item xs={12} sm={6} md={4} key={incidentType}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={birForm.incidents.includes(incidentType)}
                              onChange={() => handleIncidentToggle(incidentType)}
                            />
                          }
                          label={incidentType}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>


                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    multiline
                    rows={3}
                    value={birForm.remarks}
                    onChange={(e) => setBirForm(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <input
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      style={{ display: 'none' }}
                      id="bir-file-upload"
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <label htmlFor="bir-file-upload">
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

                {birForm.files.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Uploaded Files:
                    </Typography>
                    <List dense>
                      {birForm.files.map((file, index) => (
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
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveBIR} 
            variant="contained"
          >
            {birData.hasBIR ? 'Update' : 'Add'} BIR Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BIRManager;
