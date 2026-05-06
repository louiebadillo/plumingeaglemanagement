import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip
} from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip
} from 'recharts';

function WellBeingReport({ 
  wellbeingScore, 
  indicator, 
  pieChartData, 
  summaryTables,
  fillableData,
  onFillableDataChange,
  readOnly = false,
  isPrint = false
}) {
  const [activities, setActivities] = useState(
    fillableData?.activities || {
      insideGH: '',
      outsideGH: ''
    }
  );

  // Sync state with prop changes (when restoring from localStorage)
  useEffect(() => {
    if (fillableData?.activities) {
      setActivities({
        insideGH: fillableData.activities.insideGH || '',
        outsideGH: fillableData.activities.outsideGH || ''
      });
    }
  }, [fillableData?.activities]);

  const handleActivitiesChange = (field, value) => {
    const newActivities = { ...activities, [field]: value };
    setActivities(newActivities);
    onFillableDataChange('activities', newActivities);
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

  const renderPieChart = (data, title) => {
    if (!data || data.length === 0) return null;

    // Calculate total for percentage calculation
    const total = data.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart margin={{ right: isPrint ? 10 : 0, left: isPrint ? 10 : 0 }}>
            <Pie
              data={data}
              cx={isPrint ? '35%' : '20%'}
              cy="50%"
              outerRadius={50}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend 
              formatter={(value, entry) => {
                const percentage = total > 0 ? Math.round((entry.payload.value / total) * 100) : 0;
                return `${entry.payload.name} | ${entry.payload.value} (${percentage}%)`;
              }}
              wrapperStyle={isPrint ? { paddingLeft: '16px', marginLeft: '8px' } : { paddingLeft: '40px', marginLeft: '30px' }}
              align="right"
              verticalAlign="middle"
              layout="vertical"
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom color="primary">
          Section 3: Well-Being Report
        </Typography>

        {/* Well-Being Score and Indicator */}
        <Box display="flex" alignItems="center" gap={2} mb={3} id="wellbeing-score-indicator">
          <Typography variant="h6">
            Social Well-Being Average:
          </Typography>
          <Typography variant="h4" color="primary">
            {wellbeingScore}%
          </Typography>
          <Chip
            label={indicator}
            color={getIndicatorColor(indicator)}
            size="large"
          />
        </Box>

        {/* School Attendance Pie Chart */}
        <Grid 
          container 
          spacing={3} 
          mb={3}
          sx={{
            // Screen-only responsive styling (not applied in PDF)
            '@media screen': {
              '& .MuiGrid-item': {
                minWidth: 0, // Prevent overflow
                overflow: 'visible'
              }
            }
          }}
        >
          <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
            {renderPieChart(pieChartData?.school, 'School Attendance')}
          </Grid>
        </Grid>

        {/* Social Appointments Summary */}
        <Typography variant="h6" gutterBottom>
          Non-Health Related Appointments Summary
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Compliance</strong></TableCell>
                <TableCell><strong>Remarks</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryTables?.socialAppointments?.length > 0 ? (
                summaryTables.socialAppointments.map((apt, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.date}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.type}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.compliance}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.remarks}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ verticalAlign: 'top' }}>
                    No social appointments recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Activities Assessment */}
        <Typography variant="h6" gutterBottom id="activities-assessment-title">
          Activities Assessment
        </Typography>
        <TableContainer component={Paper} id="activities-assessment-table" className="pdf-avoid-break">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Activity Type</strong></TableCell>
                <TableCell><strong>Remarks</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Typography variant="body1" fontWeight="medium">
                    Activities while inside GH
                  </Typography>
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Describe activities and engagement while inside the group home..."
                    value={activities.insideGH}
                    onChange={(e) => handleActivitiesChange('insideGH', e.target.value)}
                    InputProps={{ readOnly }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Typography variant="body1" fontWeight="medium">
                    Activities while outside GH
                  </Typography>
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Describe activities and engagement while outside the group home..."
                    value={activities.outsideGH}
                    onChange={(e) => handleActivitiesChange('outsideGH', e.target.value)}
                    InputProps={{ readOnly }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
    </>
  );
}

export default WellBeingReport;
