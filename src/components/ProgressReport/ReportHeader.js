import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar
} from '@mui/material';
import { format } from 'date-fns';

function ReportHeader({ 
  client, 
  dateRange, 
  overallScore, 
  indicator,
  reportDate 
}) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getIndicatorColor = (indicator) => {
    switch (indicator) {
      case 'Excellent': return 'success';
      case 'Good': return 'primary';
      case 'Fair': return 'warning';
      case 'Needs Improvement': return 'error';
      default: return 'default';
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card sx={{ mb: 3 }} id="report-header">
      <CardContent>
        {/* Logo and Title - Side by Side */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box sx={{ width: 120, height: 'auto' }}>
            <img 
              src="/pellogofinal.png" 
              alt="Company Logo" 
              style={{ 
                width: '100%', 
                height: 'auto',
                maxHeight: '80px',
                objectFit: 'contain'
              }} 
            />
          </Box>
          <Box textAlign="right">
            <Typography variant="h4" component="h1" gutterBottom>
              Progress Report
            </Typography>
            <Typography variant="h5" color="primary">
              {client?.first_name} {client?.last_name}
            </Typography>
          </Box>
        </Box>

        {/* Client Information Grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              Client Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Date of Birth:</strong>
                </Typography>
                <Typography variant="body1">
                  {formatDate(client?.date_of_birth)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Age:</strong>
                </Typography>
                <Typography variant="body1">
                  {calculateAge(client?.date_of_birth)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Alberta Health #:</strong>
                </Typography>
                <Typography variant="body1">
                  {client?.alberta_health_card_number || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Client ID No:</strong>
                </Typography>
                <Typography variant="body1">
                  {client?.client_id_no || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Band No:</strong>
                </Typography>
                <Typography variant="body1">
                  {client?.band_no || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Date of Intake:</strong>
                </Typography>
                <Typography variant="body1">
                  {formatDate(client?.admission_date)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              Report Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Report Date:</strong>
                </Typography>
                <Typography variant="body1">
                  {formatDate(reportDate)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Date Range:</strong>
                </Typography>
                <Typography variant="body1">
                  {formatDate(dateRange?.startDate)} - {formatDate(dateRange?.endDate)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Facility:</strong>
                </Typography>
                <Typography variant="body1">
                  {client?.facilities?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Room:</strong>
                </Typography>
                <Typography variant="body1">
                  {client?.room || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Overall Score and Indicator - Bottom Section */}
        <Box id="overall-score-indicator" display="flex" justifyContent="center" alignItems="center" gap={4} mt={4} pt={3} borderTop="1px solid #e0e0e0">
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Overall Score
            </Typography>
            <Typography variant="h3" color="primary" gutterBottom>
              {overallScore}%
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Performance Indicator
            </Typography>
            <Chip
              label={indicator}
              color={getIndicatorColor(indicator)}
              size="large"
              sx={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '120px' }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ReportHeader;
