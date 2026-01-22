import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Paper,
  Checkbox,
  ListItemIcon
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { uploadFile, deleteFile, getFileUrl } from '../../utils/fileUpload';
import { supabase } from '../../lib/supabase';

const FILE_CATEGORIES = {
  'general': { label: 'General Files', color: 'default' },
  'appointments': { label: 'Appointments', color: 'primary' },
  'bir': { label: 'BIR Reports', color: 'error' },
  'awol': { label: 'AWOL Reports', color: 'warning' },
  'injury': { label: 'Injury Reports', color: 'secondary' }
};

function ClientFileManager({ clientId, clientName, isAdmin }) {
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('appointments');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFiles, setSelectedFiles] = useState(new Set()); // Set of file keys: "category-index"
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchAllFiles();
    }
  }, [clientId]);

  const fetchAllFiles = async () => {
    try {
      setLoading(true);
      const allFiles = {};
      
      // Initialize all categories
      Object.keys(FILE_CATEGORIES).forEach(category => {
        allFiles[category] = [];
      });
      
      // Fetch all reports for this client that contain file data
      const { data: reports, error } = await supabase
        .from('daily_reports_v2')
        .select('id, report_date, awol_files, injury_files, appointments, bir_incidents, status')
        .eq('client_id', clientId)
        .not('status', 'is', null); // Only get submitted reports
      
      if (error) {
        console.error('Error fetching reports:', error);
        setFiles(allFiles);
        return;
      }
      
      console.log('🔍 ClientFileManager - Fetched reports:', reports);
      
      // Process each report to extract file data
      reports.forEach(report => {
        // AWOL files
        if (report.awol_files && Array.isArray(report.awol_files) && report.awol_files.length > 0) {
          allFiles.awol.push(...report.awol_files.map(file => ({
            ...file,
            reportId: report.id,
            reportDate: report.report_date,
            category: 'awol'
          })));
        }
        
        // Injury files
        if (report.injury_files && Array.isArray(report.injury_files) && report.injury_files.length > 0) {
          allFiles.injury.push(...report.injury_files.map(file => ({
            ...file,
            reportId: report.id,
            reportDate: report.report_date,
            category: 'injury'
          })));
        }
        
        // Appointment files
        if (report.appointments && Array.isArray(report.appointments)) {
          report.appointments.forEach(appointment => {
            if (appointment.files && Array.isArray(appointment.files) && appointment.files.length > 0) {
              allFiles.appointments.push(...appointment.files.map(file => ({
                ...file,
                reportId: report.id,
                reportDate: report.report_date,
                category: 'appointments',
                appointmentType: appointment.type
              })));
            }
          });
        }
        
        // BIR files
        if (report.bir_incidents && report.bir_incidents.files && Array.isArray(report.bir_incidents.files) && report.bir_incidents.files.length > 0) {
          allFiles.bir.push(...report.bir_incidents.files.map(file => ({
            ...file,
            reportId: report.id,
            reportDate: report.report_date,
            category: 'bir'
          })));
        }
        
        // General files (temporarily disabled until migration is run)
        // if (report.general_files && Array.isArray(report.general_files) && report.general_files.length > 0) {
        //   allFiles.general.push(...report.general_files.map(file => ({
        //     ...file,
        //     reportId: report.id,
        //     reportDate: report.report_date,
        //     category: 'general'
        //   })));
        // }
      });
      
      console.log('🔍 ClientFileManager - Processed files:', allFiles);
      setFiles(allFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    
    try {
      // For categories that require dates (BIR, Appointment, AWOL, Injury), use selected date
      // For general files, use today's date
      const categoriesWithDates = ['bir', 'appointments', 'awol', 'injury'];
      const dateToUse = categoriesWithDates.includes(selectedCategory) 
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      const fileData = await uploadFile(file, clientId, selectedCategory, dateToUse);
      
      // Update local state
      setFiles(prev => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), fileData]
      }));
      
      setOpenUploadDialog(false);
      setSelectedFile(null);
      setSelectedDate(new Date()); // Reset date for next upload
      // Refresh files list
      fetchAllFiles();
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(`Failed to upload file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (filePath, category) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(filePath, category);
        
        // Update local state
        setFiles(prev => ({
          ...prev,
          [category]: prev[category].filter(file => file.path !== filePath)
        }));
      } catch (error) {
        console.error('File deletion error:', error);
        alert(`Failed to delete file: ${error.message}`);
      }
    }
  };

  const handleFileDownload = async (file) => {
    try {
      const url = await getFileUrl(file.path, file.category);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  const handleToggleFileSelection = (category, index) => {
    const fileKey = `${category}-${index}`;
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileKey)) {
        newSet.delete(fileKey);
      } else {
        newSet.add(fileKey);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allFileKeys = new Set();
    Object.keys(FILE_CATEGORIES).forEach(category => {
      const categoryFiles = files[category] || [];
      categoryFiles.forEach((_, index) => {
        allFileKeys.add(`${category}-${index}`);
      });
    });
    setSelectedFiles(allFileKeys);
  };

  const handleDeselectAll = () => {
    setSelectedFiles(new Set());
  };

  const getSelectedFilesData = () => {
    const selectedFilesData = [];
    selectedFiles.forEach(fileKey => {
      const [category, index] = fileKey.split('-');
      const categoryFiles = files[category] || [];
      if (categoryFiles[parseInt(index)]) {
        selectedFilesData.push({
          ...categoryFiles[parseInt(index)],
          category
        });
      }
    });
    return selectedFilesData;
  };

  const handleBulkDownload = async () => {
    const selectedFilesData = getSelectedFilesData();
    if (selectedFilesData.length === 0) {
      alert('Please select at least one file to download.');
      return;
    }

    try {
      setDownloading(true);
      for (const file of selectedFilesData) {
        try {
          await handleFileDownload(file);
          // Small delay between downloads to avoid browser blocking
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error downloading ${file.name}:`, error);
        }
      }
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Bulk download error:', error);
      alert('Some files failed to download. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleBulkDelete = async () => {
    const selectedFilesData = getSelectedFilesData();
    if (selectedFilesData.length === 0) {
      alert('Please select at least one file to delete.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedFilesData.length} file(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      let successCount = 0;
      let failCount = 0;

      for (const file of selectedFilesData) {
        try {
          await deleteFile(file.path, file.category);
          successCount++;
        } catch (error) {
          console.error(`Error deleting ${file.name}:`, error);
          failCount++;
        }
      }

      // Refresh file list
      await fetchAllFiles();
      setSelectedFiles(new Set());

      if (failCount > 0) {
        alert(`Deleted ${successCount} file(s). ${failCount} file(s) failed to delete.`);
      } else {
        alert(`Successfully deleted ${successCount} file(s).`);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Some files failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };


  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isAdmin) {
    return (
      <Alert severity="info">
        File management is only available for administrators.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const totalFiles = Object.values(files).reduce((sum, categoryFiles) => sum + categoryFiles.length, 0);
  const selectedCount = selectedFiles.size;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          File Management - {clientName}
        </Typography>
        <Box display="flex" gap={1}>
          {selectedCount > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleBulkDownload}
                disabled={downloading}
              >
                Download Selected ({selectedCount})
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                Delete Selected ({selectedCount})
              </Button>
            </>
          )}
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setOpenUploadDialog(true)}
          >
            Upload File
          </Button>
        </Box>
      </Box>

      {totalFiles > 0 && (
        <Box display="flex" gap={1} mb={2}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleSelectAll}
          >
            Select All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={handleDeselectAll}
            disabled={selectedCount === 0}
          >
            Deselect All
          </Button>
          {selectedCount > 0 && (
            <Typography variant="body2" sx={{ alignSelf: 'center', ml: 2 }}>
              {selectedCount} file(s) selected
            </Typography>
          )}
        </Box>
      )}

      {Object.keys(FILE_CATEGORIES).map((category) => {
        const categoryFiles = files[category] || [];
        const categoryInfo = FILE_CATEGORIES[category];
        
        return (
          <Accordion key={category} defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                {categoryInfo.label}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {categoryFiles.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  No files uploaded for this category.
                </Typography>
              ) : (
                <Box
                  sx={{
                    maxHeight: 400, // Approximately 4-5 files (each file ~80-100px)
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <List>
                    {categoryFiles.map((file, index) => {
                      const fileKey = `${category}-${index}`;
                      const isSelected = selectedFiles.has(fileKey);
                      return (
                      <React.Fragment key={index}>
                        <ListItem>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={isSelected}
                            onChange={() => handleToggleFileSelection(category, index)}
                            tabIndex={-1}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1">
                                {file.name}
                              </Typography>
                              <Chip
                                label={formatFileSize(file.size || 0)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              {file.reportDate && (
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Report Date: {new Date(file.reportDate).toLocaleDateString()}
                                </Typography>
                              )}
                              <Typography variant="caption" color="textSecondary" display="block">
                                Uploaded: {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'N/A'}
                              </Typography>
                              {file.remarks && (
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Remarks: {file.remarks}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              onClick={() => handleFileDownload(file)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleFileDelete(file.path, category)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < categoryFiles.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                  })}
                  </List>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Upload Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openUploadDialog} onClose={() => {
          setOpenUploadDialog(false);
          setSelectedDate(new Date());
          setUploadError('');
        }} maxWidth="sm" fullWidth>
          <DialogTitle>Upload File</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      // Reset date when category changes
                      setSelectedDate(new Date());
                    }}
                  >
                    {Object.entries(FILE_CATEGORIES).map(([key, info]) => (
                      <MenuItem key={key} value={key}>
                        {info.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Date Selection - Only for BIR, Appointment, AWOL, and Injury */}
              {['bir', 'appointments', 'awol', 'injury'].includes(selectedCategory) && (
                <Grid item xs={12}>
                  <DatePicker
                    label="Report Date"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText="Select the date this report/incident occurred"
                      />
                    )}
                  />
                </Grid>
              )}
              
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
                      startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </Button>
                  </label>
                  <Typography variant="caption" color="textSecondary">
                    PDF, JPG, PNG, DOC, DOCX (max 10MB)
                  </Typography>
                </Box>
              </Grid>
              {uploadError && (
                <Grid item xs={12}>
                  <Alert severity="error">{uploadError}</Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenUploadDialog(false);
              setSelectedDate(new Date());
              setUploadError('');
            }}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
}

export default ClientFileManager;
