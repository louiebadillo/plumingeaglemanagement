import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Description as FormIcon,
  Medication as MedicationIcon,
  Psychology as PsychologyIcon,
  HealthAndSafety as HealthIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { dataService } from '../../services/dataService';
import FormRenderer from '../FormRenderer/FormRenderer';

const FormTemplateSelector = ({ onTemplateSelect, currentTemplate = 'healthcare_metrics' }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const templates = dataService.getAvailableFormTemplates();

  const getTemplateIcon = (templateId) => {
    switch (templateId) {
      case 'healthcare_metrics':
        return <HealthIcon />;
      case 'medication_tracking':
        return <MedicationIcon />;
      case 'behavioral_assessment':
        return <PsychologyIcon />;
      default:
        return <FormIcon />;
    }
  };

  const getTemplateColor = (templateId) => {
    switch (templateId) {
      case 'healthcare_metrics':
        return 'primary';
      case 'medication_tracking':
        return 'secondary';
      case 'behavioral_assessment':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handlePreview = (templateId) => {
    const template = dataService.getFormTemplate(templateId);
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleSelect = () => {
    onTemplateSelect(selectedTemplate);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Form Template
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Choose a form template that best fits your reporting needs. You can customize fields later.
      </Typography>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: selectedTemplate === template.id ? 2 : 1,
                borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 4
                }
              }}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: `${getTemplateColor(template.id)}.light`,
                      color: `${getTemplateColor(template.id)}.contrastText`
                    }}
                  >
                    {getTemplateIcon(template.id)}
                  </Box>
                  <Box>
                    <Typography variant="h6">
                      {template.name}
                    </Typography>
                    <Chip 
                      label={`v${template.version}`} 
                      size="small" 
                      color={getTemplateColor(template.id)}
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(template.id);
                    }}
                  >
                    Preview
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSelect}
          disabled={!selectedTemplate}
        >
          Use Selected Template
        </Button>
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Form Preview: {previewTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {previewTemplate.description}
              </Typography>
              <FormRenderer
                template={previewTemplate}
                data={{}}
                onChange={() => {}}
                showCategories={true}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormTemplateSelector;
