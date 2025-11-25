import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Snackbar
} from '@mui/material';
import { supabase } from '../../lib/supabase';

function FillableFields({ 
  reportId, 
  initialData = {}, 
  onDataChange 
}) {
  const [fillableData, setFillableData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setFillableData(initialData);
  }, [initialData]);

  const handleFieldChange = (section, field, value) => {
    const newData = {
      ...fillableData,
      [section]: {
        ...fillableData[section],
        [field]: value
      }
    };
    setFillableData(newData);
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  const handleSave = async () => {
    if (!reportId) {
      setSaveError('No report ID provided');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from('progress_reports')
        .update({ 
          fillable_data: fillableData,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        throw error;
      }

      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving fillable data:', error);
      setSaveError(error.message || 'Failed to save data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSaveSuccess(false);
    setSaveError(null);
  };

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fillable Fields Manager
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            This component manages all fillable fields in the progress report.
            Changes are automatically tracked and can be saved to the database.
          </Typography>

          {/* Save Controls */}
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving}
              color="primary"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setFillableData(initialData)}
              disabled={isSaving}
            >
              Reset to Original
            </Button>
          </Box>

          {/* Status Messages */}
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}

          {/* Data Preview */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Current Fillable Data:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={JSON.stringify(fillableData, null, 2)}
              InputProps={{ readOnly: true }}
              variant="outlined"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for save feedback */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="Fillable data saved successfully!"
      />
      <Snackbar
        open={!!saveError}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={saveError}
      />
    </Box>
  );
}

export default FillableFields;
