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
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

function BehaviourReport({ 
  behaviourScore, 
  indicator, 
  pieChartData, 
  summaryTables,
  birSummary,
  awolSummary,
  fillableData,
  onFillableDataChange,
  readOnly = false,
  mode = 'full' // 'full' | 'incidents'
}) {
  const [behaviourRemarks, setBehaviourRemarks] = useState(
    fillableData?.behaviourRemarks || {
      mood: '',
      attitude: '',
      miscellaneous: ''
    }
  );

  // Sync state with prop changes (when restoring from localStorage)
  useEffect(() => {
    if (fillableData?.behaviourRemarks) {
      setBehaviourRemarks({
        mood: fillableData.behaviourRemarks.mood || '',
        attitude: fillableData.behaviourRemarks.attitude || '',
        miscellaneous: fillableData.behaviourRemarks.miscellaneous || ''
      });
    }
  }, [fillableData?.behaviourRemarks]);

  const handleBehaviourRemarksChange = (field, value) => {
    const newRemarks = { ...behaviourRemarks, [field]: value };
    setBehaviourRemarks(newRemarks);
    onFillableDataChange('behaviourRemarks', newRemarks);
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
          <PieChart margin={{ right: 0, left: 0 }}>
            <Pie
              data={data}
              cx="20%"
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
              wrapperStyle={{ paddingLeft: '40px', marginLeft: '30px' }}
              align="right"
              verticalAlign="middle"
              layout="vertical"
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderBarChart = (data, title) => {
    if (!data || data.length === 0) return null;

    return (
      <Box 
        sx={{ 
          mb: 3,
          width: '100%',
          // Screen-only responsive styling
          '@media screen': {
            minWidth: 0,
            overflow: 'visible',
            '& .recharts-wrapper': {
              overflow: 'visible !important'
            },
            '& .recharts-surface': {
              overflow: 'visible !important'
            }
          }
        }}
      >
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box 
          sx={{
            width: '100%',
            '@media screen': {
              minHeight: '400px',
              '& .recharts-responsive-container': {
                width: '100% !important',
                minHeight: '400px'
              }
            }
          }}
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom color="primary" id="section4-title">
          {mode === 'incidents' ? 'Section 4: Incidents (BIR / AWOL / Injuries)' : 'Section 4: Behaviour Report'}
        </Typography>

        {mode !== 'incidents' && (
          <>
            {/* Behaviour Score and Indicator */}
            <Box display="flex" alignItems="center" gap={2} mb={3} id="behaviour-score">
              <Typography variant="h6">
                Behaviour Score Average:
              </Typography>
              <Typography variant="h4" color="primary">
                {behaviourScore}%
              </Typography>
              <Chip
                label={indicator}
                color={getIndicatorColor(indicator)}
                size="large"
              />
            </Box>

            {/* Behaviour Pie Charts */}
            <Grid 
              container 
              spacing={3} 
              mb={3} 
              id="behaviour-charts" 
              className="pdf-avoid-break"
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
                {renderPieChart(pieChartData?.behaviour?.observation, 'Behaviour Observation')}
              </Grid>
              <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderPieChart(pieChartData?.behaviour?.followedRules, 'Followed Rules')}
              </Grid>
              <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderPieChart(pieChartData?.behaviour?.listened, 'Listened to Instructions')}
              </Grid>
              <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderPieChart(pieChartData?.behaviour?.control, 'Able to Control Behaviour')}
              </Grid>
            </Grid>

            {/* BIR/AWOL score averages */}
            <Box mb={2} id="bir-awol-score-averages" className="pdf-avoid-break">
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    BIR score average
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {birSummary && birSummary.totalDays > 0 ? (
                      <>
                        <strong>{birSummary.averagePercent}%</strong>
                        {' — '}
                        {birSummary.trueDays} BIR day{birSummary.trueDays === 1 ? '' : 's'} out of{' '}
                        {birSummary.totalDays} filtered report day{birSummary.totalDays === 1 ? '' : 's'}
                      </>
                    ) : (
                      'No filtered report days in this range.'
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    AWOL score average
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {awolSummary && awolSummary.totalDays > 0 ? (
                      <>
                        <strong>{awolSummary.averagePercent}%</strong>
                        {' — '}
                        {awolSummary.trueDays} AWOL day{awolSummary.trueDays === 1 ? '' : 's'} out of{' '}
                        {awolSummary.totalDays} filtered report day{awolSummary.totalDays === 1 ? '' : 's'}
                      </>
                    ) : (
                      'No filtered report days in this range.'
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Behaviour Assessment Table */}
            <Typography variant="h6" gutterBottom id="behaviour-assessment-title">
              Behaviour Assessment
            </Typography>
            <TableContainer component={Paper} id="behaviour-assessment-table" className="pdf-avoid-break">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '25%' }}><strong>Category</strong></TableCell>
                    <TableCell sx={{ width: '75%' }}><strong>Remarks</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="body1" fontWeight="medium">
                        Mood (include significant isolated changes in mood and possible reason/s why client felt that way)
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Describe mood patterns, changes, and possible reasons..."
                        value={behaviourRemarks.mood}
                        onChange={(e) => handleBehaviourRemarksChange('mood', e.target.value)}
                        InputProps={{ readOnly }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="body1" fontWeight="medium">
                        Attitude towards staff/management
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Describe attitude and interactions with staff and management..."
                        value={behaviourRemarks.attitude}
                        onChange={(e) => handleBehaviourRemarksChange('attitude', e.target.value)}
                        InputProps={{ readOnly }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="body1" fontWeight="medium">
                        Miscellaneous/Injuries
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Any miscellaneous observations or injury-related notes..."
                        value={behaviourRemarks.miscellaneous}
                        onChange={(e) => handleBehaviourRemarksChange('miscellaneous', e.target.value)}
                        InputProps={{ readOnly }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {mode === 'incidents' && (
        <>
        {/* BIR Bar Chart */}
        <Box mb={3} id="bir-charts" className="pdf-avoid-break">
          {renderBarChart(pieChartData?.birBarChart, 'BIR Incidents by Type')}
        </Box>

        {/* Incident Pie Charts */}
        <Grid 
          container 
          spacing={3} 
          mb={3} 
          id="incident-charts"
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
          <Grid item xs={12} md={6} id="awol-chart" sx={{ minWidth: 0, overflow: 'visible' }}>
            {renderPieChart(pieChartData?.incidents?.awol, 'AWOL Incidents by Type')}
          </Grid>
          <Grid item xs={12} md={6} id="injury-chart" sx={{ minWidth: 0, overflow: 'visible' }}>
            {renderPieChart(pieChartData?.incidents?.injury, 'Injury Types')}
          </Grid>
        </Grid>

        {/* BIR/AWOL score averages (100% = no incident that day; 0% = any incident that day) */}
        <Box mb={2} id="incident-score-averages" className="pdf-avoid-break">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                BIR score average
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {birSummary && birSummary.totalDays > 0 ? (
                  <>
                    <strong>{birSummary.averagePercent}%</strong>
                    {' — '}
                    {birSummary.trueDays} BIR day{birSummary.trueDays === 1 ? '' : 's'} out of{' '}
                    {birSummary.totalDays} filtered report day{birSummary.totalDays === 1 ? '' : 's'}
                  </>
                ) : (
                  'No filtered report days in this range.'
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                AWOL score average
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {awolSummary && awolSummary.totalDays > 0 ? (
                  <>
                    <strong>{awolSummary.averagePercent}%</strong>
                    {' — '}
                    {awolSummary.trueDays} AWOL day{awolSummary.trueDays === 1 ? '' : 's'} out of{' '}
                    {awolSummary.totalDays} filtered report day{awolSummary.totalDays === 1 ? '' : 's'}
                  </>
                ) : (
                  'No filtered report days in this range.'
                )}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Summary Tables - Stacked Vertically */}
        <Box sx={{ mb: 3 }} id="incident-summaries">
          {/* BIR Summary */}
          <Typography variant="h6" gutterBottom id="bir-summary-title">
            BIR Incidents Summary
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }} id="bir-summary" className="pdf-avoid-break">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Remarks</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryTables?.birs?.length > 0 ? (
                  summaryTables.birs.map((bir, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ verticalAlign: 'top' }}>{bir.date}</TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>{bir.type}</TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>{bir.remarks}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ verticalAlign: 'top' }}>
                      No BIR incidents
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* AWOL Summary */}
          <Typography variant="h6" gutterBottom id="awol-summary-title">
            AWOL Incidents Summary
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }} id="awol-summary" className="pdf-avoid-break">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryTables?.awols?.length > 0 ? (
                  summaryTables.awols.map((awol, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ verticalAlign: 'top' }}>{awol.date}</TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>{awol.type}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ verticalAlign: 'top' }}>
                      No AWOL incidents
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Injuries Summary */}
          <Typography variant="h6" gutterBottom id="injury-summary-title">
            Injuries Summary
          </Typography>
          <TableContainer component={Paper} id="injury-summary" className="pdf-avoid-break">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Perpetrator</strong></TableCell>
                  <TableCell><strong>Remarks</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryTables?.injuries?.length > 0 ? (
                  summaryTables.injuries.map((injury, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ verticalAlign: 'top' }}>{injury.date}</TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>{injury.type}</TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>{injury.perpetrator}</TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>{injury.remarks}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ verticalAlign: 'top' }}>
                      No injuries recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        </>
        )}
      </CardContent>
    </Card>
    </>
  );
}

export default BehaviourReport;
