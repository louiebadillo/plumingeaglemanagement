import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField
} from '@mui/material';
import { format } from 'date-fns';
import { calculateAge } from '../../utils/dateHelpers';

function ReportHeader({ 
  client, 
  dateRange, 
  overallScore, 
  indicator,
  reportDate,
  dailyReportsCount,
  generatedBy,
  generatedAt,
  overview = '',
  onOverviewChange,
  overviewReadOnly = false,
  compactForPrint = false,
  titleText = 'Progress Report',
  showOverall = true,
  overviewLabel = 'Overview'
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

  return (
    <Card
      sx={{
        mb: 3,
        ...(compactForPrint
          ? { '@media print': { mb: 0, boxShadow: 'none' } }
          : {}),
      }}
      id="report-header"
    >
      <CardContent
        sx={
          compactForPrint
            ? { '@media print': { py: 1, px: 1.5, '&:last-child': { pb: 1 } } }
            : {}
        }
      >
        {/* Logo and Title - Side by Side */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={compactForPrint ? 1.5 : 3}
          sx={
            compactForPrint
              ? { '@media print': { mb: 1 } }
              : {}
          }
        >
          <Box
            sx={{
              width: 120,
              height: 'auto',
              ...(compactForPrint
                ? { '@media print': { width: 72, maxWidth: 72 } }
                : {}),
            }}
          >
            <img 
              src="/pellogofinal.png" 
              alt="Company Logo" 
              style={{ 
                width: '100%', 
                height: 'auto',
                maxHeight: compactForPrint ? 56 : 80,
                objectFit: 'contain'
              }} 
            />
          </Box>
          <Box textAlign="right">
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={compactForPrint ? { '@media print': { fontSize: '1.15rem', mb: 0.25 } } : {}}
            >
              {titleText}
            </Typography>
            <Typography
              variant="h5"
              color="primary"
              sx={compactForPrint ? { '@media print': { fontSize: '1rem' } } : {}}
            >
              {client?.first_name} {client?.last_name}
            </Typography>
          </Box>
        </Box>

        {/* Client Information Grid */}
        <Grid
          container
          spacing={compactForPrint ? 2 : 3}
          sx={compactForPrint ? { '@media print': { mt: 0 } } : {}}
        >
          <Grid item xs={12} md={6}>
            <Typography
              variant="h6"
              gutterBottom
              color="primary"
              sx={compactForPrint ? { '@media print': { fontSize: '0.8rem', mb: 0.5 } } : {}}
            >
              Client Information
            </Typography>
            <Grid
              container
              spacing={compactForPrint ? 1 : 2}
              sx={compactForPrint ? { '@media print': { '& > .MuiGrid-item': { pt: '6px !important' } } } : {}}
            >
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
            <Typography
              variant="h6"
              gutterBottom
              color="primary"
              sx={compactForPrint ? { '@media print': { fontSize: '0.8rem', mb: 0.5 } } : {}}
            >
              Report Information
            </Typography>
            <Grid
              container
              spacing={compactForPrint ? 1 : 2}
              sx={compactForPrint ? { '@media print': { '& > .MuiGrid-item': { pt: '6px !important' } } } : {}}
            >
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Report Date:</strong>
                </Typography>
                <Typography variant="body1">
                  {formatDate(reportDate)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Date Range:</strong>
                </Typography>
                <Typography variant="body1">
                  {formatDate(dateRange?.startDate)} - {formatDate(dateRange?.endDate)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Facility:</strong>
                </Typography>
                <Typography variant="body1">
                  {client?.facilities?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Room:</strong>
                </Typography>
                <Typography variant="body1">
                  {client?.room || 'N/A'}
                </Typography>
              </Grid>
              {dailyReportsCount !== undefined && dailyReportsCount !== null && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Submitted daily reports in range:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {dailyReportsCount}
                  </Typography>
                </Grid>
              )}
              {generatedAt != null && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Generated at:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(generatedAt), 'MMM dd, yyyy h:mm a')}
                  </Typography>
                </Grid>
              )}
              {generatedBy ? (
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Generated by:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {generatedBy}
                  </Typography>
                </Grid>
              ) : null}
            </Grid>
          </Grid>
        </Grid>

        {/* Overall Score and Indicator - Bottom Section */}
        {showOverall && (
          <Box
            id="overall-score-indicator"
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={compactForPrint ? 2 : 4}
            mt={compactForPrint ? 2 : 4}
            pt={compactForPrint ? 1.5 : 3}
            borderTop="1px solid #e0e0e0"
            sx={
              compactForPrint
                ? { '@media print': { mt: 1, pt: 1, gap: 2 } }
                : {}
            }
          >
            <Box textAlign="center">
              <Typography
                variant="h6"
                gutterBottom
                sx={compactForPrint ? { '@media print': { fontSize: '0.75rem', mb: 0 } } : {}}
              >
                Overall Score
              </Typography>
              <Typography
                variant="h3"
                color="primary"
                gutterBottom
                sx={compactForPrint ? { '@media print': { fontSize: '1.35rem', mb: 0 } } : {}}
              >
                {overallScore}%
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography
                variant="h6"
                gutterBottom
                sx={compactForPrint ? { '@media print': { fontSize: '0.75rem', mb: 0 } } : {}}
              >
                Performance Indicator
              </Typography>
              <Chip
                label={indicator}
                color={getIndicatorColor(indicator)}
                size="large"
                sx={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  minWidth: '120px',
                  ...(compactForPrint
                    ? {
                        '@media print': {
                          fontSize: '0.75rem',
                          minHeight: 28,
                          '& .MuiChip-label': { px: 1 },
                        },
                      }
                    : {}),
                }}
              />
            </Box>
          </Box>
        )}

        <Box
          id="report-overview-section"
          mt={compactForPrint ? 2 : 3}
          pt={compactForPrint ? 1.5 : 3}
          borderTop="1px solid #e0e0e0"
          sx={compactForPrint ? { '@media print': { mt: 1, pt: 1 } } : {}}
        >
          <Typography
            variant="h6"
            gutterBottom
            color="primary"
            sx={compactForPrint ? { '@media print': { fontSize: '0.8rem', mb: 0.5 } } : {}}
          >
            {overviewLabel}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={compactForPrint ? 2 : 5}
            placeholder="High-level summary for this reporting period..."
            value={overview}
            onChange={(e) => onOverviewChange?.(e.target.value)}
            InputProps={{
              readOnly: overviewReadOnly || !onOverviewChange,
            }}
            sx={{
              '& .MuiInputBase-input': {
                whiteSpace: 'pre-wrap',
                overflow: 'visible',
              },
              '& textarea': {
                overflow: 'visible !important',
              },
              ...(compactForPrint
                ? {
                    '@media print': {
                      '& .MuiInputBase-input': {
                        fontSize: '8.5pt',
                        lineHeight: 1.25,
                        py: 0.5,
                      },
                    },
                  }
                : {}),
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default ReportHeader;
