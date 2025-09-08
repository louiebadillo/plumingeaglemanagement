import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { getClientById } from '../../context/clientMock';
import { getCurrentUserRole } from '../../components/Sidebar/getSidebarStructure';
import { dataService, QUESTIONNAIRE_METRICS } from '../../services/dataService';

function CreateReport() {
  const history = useHistory();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Get client and facility from URL params
  const urlParams = new URLSearchParams(location.search);
  const clientId = urlParams.get('clientId');
  const facilityId = urlParams.get('facility');
  
  const client = clientId ? getClientById(parseInt(clientId)) : null;
  const userRole = getCurrentUserRole();
  
  // Initialize form data with configurable metrics
  const initializeFormData = () => {
    const questionnaire = {};
    Object.keys(QUESTIONNAIRE_METRICS).forEach(key => {
      questionnaire[key] = 5; // Default middle value
    });
    
    return {
      clientId: clientId ? parseInt(clientId) : null,
      facilityId: facilityId,
      date: new Date().toISOString().split('T')[0],
      shift: 'Morning',
      staffMember: 'Current User', // Will be replaced with actual user data
      questionnaire,
      notes: '',
      incidents: '',
      medications: '',
      goalsProgress: '',
      status: 'incomplete' // incomplete, complete, submitted
    };
  };

  const [formData, setFormData] = useState(initializeFormData());

  const handleInputChange = (field, value) => {
    if (field.startsWith('questionnaire.')) {
      const questionKey = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        questionnaire: {
          ...prev.questionnaire,
          [questionKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async (status = 'incomplete') => {
    setLoading(true);
    try {
      const reportData = {
        ...formData,
        status: status,
        lastSaved: new Date().toISOString()
      };
      
      // Validate data before saving
      const validation = dataService.validateReportData(reportData);
      if (!validation.isValid) {
        alert(`Validation errors: ${validation.errors.join(', ')}`);
        return;
      }
      
      const result = await dataService.saveReport(reportData);
      setSaved(true);
      
      if (status === 'submitted') {
        alert('Report submitted successfully!');
        history.push('/app/reports/my-reports');
      } else {
        alert('Report saved as draft!');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  if (!client) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Client not found. Please go back and try again.
        </Alert>
        <Button onClick={handleBack} startIcon={<BackIcon />} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  // Get questionnaire items from configurable metrics
  const questionnaireItems = dataService.getQuestionnaireMetrics();

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button onClick={handleBack} startIcon={<BackIcon />} color="primary">
          Back
        </Button>
        <Typography variant="h4">
          Daily Report - {client.firstName} {client.lastName}
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Report saved successfully!
        </Alert>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Report Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Report Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Shift</InputLabel>
                <Select
                  value={formData.shift}
                  onChange={(e) => handleInputChange('shift', e.target.value)}
                >
                  <MenuItem value="Morning">Morning (6 AM - 2 PM)</MenuItem>
                  <MenuItem value="Afternoon">Afternoon (2 PM - 10 PM)</MenuItem>
                  <MenuItem value="Evening">Evening (10 PM - 6 AM)</MenuItem>
                  <MenuItem value="Night">Night (6 PM - 6 AM)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Client"
                value={`${client.firstName} ${client.lastName}`}
                disabled
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Staff Member"
                value={formData.staffMember}
                disabled
              />
            </Grid>

            {/* Health Questionnaire */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Health Assessment (1-10 Scale)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Rate each aspect from 1 (Poor) to 10 (Excellent)
              </Typography>
            </Grid>

            {questionnaireItems.map((item) => (
              <Grid item xs={12} key={item.key}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {item.description}
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={formData.questionnaire[item.key]}
                      onChange={(e, value) => handleInputChange(`questionnaire.${item.key}`, value)}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                    <Box display="flex" justifyContent="space-between">
                      <Chip label="1 - Poor" size="small" color="error" />
                      <Chip label="5 - Average" size="small" color="warning" />
                      <Chip label="10 - Excellent" size="small" color="success" />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}

            {/* Additional Notes */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Additional Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="General Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any general observations or notes about the client today..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Incidents or Concerns"
                multiline
                rows={2}
                value={formData.incidents}
                onChange={(e) => handleInputChange('incidents', e.target.value)}
                placeholder="Any notable incidents, concerns, or unusual behaviors..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medication Notes"
                multiline
                rows={2}
                value={formData.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="Any medication-related notes or observations..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Goals Progress"
                multiline
                rows={2}
                value={formData.goalsProgress}
                onChange={(e) => handleInputChange('goalsProgress', e.target.value)}
                placeholder="Progress on treatment goals or objectives..."
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleSave('incomplete')}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSave('submitted')}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  Submit Report
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateReport;
