import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useHistory } from 'react-router-dom';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';
import { getOperationalDate, formatDateLocal } from '../../utils/dateHelpers';
import { useSupabase } from '../../context/SupabaseContext';

function DateSelectionModal({ open, onClose, client, facilityId }) {
  const { userProfile } = useSupabase();
  const isAdmin = userProfile?.role === 'admin';
  const history = useHistory();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [existingReports, setExistingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [clientInFacility, setClientInFacility] = useState(null);

  // Load existing report dates for this client
  useEffect(() => {
    if (open && client?.id) {
      loadExistingReports();
      // Reset state when modal opens
      setClientInFacility(null);
      // For employees: set to operational date, for admins: set to today
      const initialDate = isAdmin ? new Date() : new Date(getOperationalDate() + 'T12:00:00');
      setSelectedDate(initialDate);
      setError(null);
      setSuccessMessage(null);
    }
  }, [open, client?.id, isAdmin]);

  const loadExistingReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(
        `${supabaseUrl}/rest/v1/daily_reports_v2?client_id=eq.${client.id}&select=report_date,status`,
        {
          method: 'GET',
          headers: getSupabaseHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reports = await response.json();
      setExistingReports(reports || []);
    } catch (error) {
      console.error('Error loading existing reports:', error);
      setError('Failed to load existing reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelection = async (date) => {
    if (!date) return;
    
    // Use local date formatting to avoid timezone issues
    const dateStr = formatDateLocal(date);
    const existingReport = existingReports.find(report => report.report_date === dateStr);
    
    // For admins: Show warning if report exists but allow them to proceed
    if (isAdmin && existingReport && existingReport.status === 'submitted') {
      const proceed = window.confirm(
        `A report has already been submitted for ${dateStr}. ` +
        `You are about to create/edit a report for this date, which will overwrite the existing report. ` +
        `Do you want to continue?`
      );
      if (!proceed) {
        return;
      }
    } else if (!isAdmin && existingReport && existingReport.status === 'submitted') {
      setError('A report has already been submitted for this date. Please select a different date.');
      return;
    }
    
    // If client is not in facility, show message and close modal (no database entry)
    if (clientInFacility === false) {
      // Show success message
      setSuccessMessage('No report is needed for this client.');
      setError(null);
      
      // Close modal after a brief delay so user can see the message
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 2000);
      return;
    }
    
    // Navigate to the daily report form
    // Only include facility in URL if it's a valid UUID (not null or undefined)
    const facilityParam = facilityId && facilityId !== 'null' && facilityId !== 'undefined' ? `&facility=${facilityId}` : '';
    const reportUrl = `/app/reports/daily-report?clientId=${client.id}&date=${dateStr}${facilityParam}`;
    history.push(reportUrl);
    onClose();
  };

  const isDateDisabled = (date) => {
    if (!date) return false;
    // Use local date formatting to avoid timezone issues
    const dateStr = formatDateLocal(date);
    
    // For employees: disable dates before today's operational date
    if (!isAdmin) {
      const operationalDate = getOperationalDate();
      
      // Compare date strings directly (YYYY-MM-DD format)
      // Disable dates before today's operational date
      if (dateStr < operationalDate) {
        return true;
      }
    }
    
    // For employees: disable dates with submitted reports
    // For admins: allow editing submitted reports (don't disable)
    if (!isAdmin) {
      const existingReport = existingReports.find(report => report.report_date === dateStr);
      return existingReport && existingReport.status === 'submitted';
    }
    
    return false;
  };

  const getDateStatus = (date) => {
    if (!date) return null;
    // Use local date formatting to avoid timezone issues
    const dateStr = formatDateLocal(date);
    const existingReport = existingReports.find(report => report.report_date === dateStr);
    
    if (existingReport) {
      return existingReport.status === 'submitted' ? 'Submitted' : 'Draft';
    }
    return null;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!client) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create Daily Report for {client.first_name} {client.last_name}
        </DialogTitle>
        
        <DialogContent>
          {loading && (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Loading existing reports...
              </Typography>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Date Selection - Only for Admins */}
              {isAdmin && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Select Report Date
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Select a specific date:
                  </Typography>
                  <DatePicker
                    label="Report Date"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    shouldDisableDate={isDateDisabled}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText={
                          selectedDate && getDateStatus(selectedDate) 
                            ? `Status: ${getDateStatus(selectedDate)}`
                            : 'Select a date for the report'
                        }
                      />
                    )}
                  />
                  {selectedDate && getDateStatus(selectedDate) === 'Submitted' && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      A report has already been submitted for this date. You can create/edit a report to overwrite it.
                    </Alert>
                  )}
                </Grid>
              )}
              
              {/* For Employees: Show operational date info */}
              {!isAdmin && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Report Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    Report will be created for today's operational date: <strong>{formatDateLocal(new Date(getOperationalDate() + 'T12:00:00'))}</strong>
                  </Typography>
                </Grid>
              )}
              
              {/* Questionnaire - For Both Employees and Admins */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">
                    Is client in the facility?
                  </FormLabel>
                  <RadioGroup
                    value={clientInFacility === null ? '' : clientInFacility ? 'true' : 'false'}
                    onChange={(e) => setClientInFacility(e.target.value === 'true')}
                  >
                    <FormControlLabel 
                      value="true" 
                      control={<Radio />} 
                      label="Yes (proceed to create report)" 
                    />
                    <FormControlLabel 
                      value="false" 
                      control={<Radio />} 
                      label="No (no daily report for this client)" 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              // For employees: use operational date, for admins: use selected date
              const dateToUse = isAdmin ? selectedDate : new Date(getOperationalDate() + 'T12:00:00');
              handleDateSelection(dateToUse);
            }}
            variant="contained"
            disabled={
              (isAdmin && (!selectedDate || isDateDisabled(selectedDate))) || 
              clientInFacility === null
            }
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default DateSelectionModal;
