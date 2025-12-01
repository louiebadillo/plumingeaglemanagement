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
  Chip,
  Button,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip
} from 'recharts';

function HealthReport({ 
  healthScore, 
  indicator, 
  pieChartData, 
  summaryTables,
  fillableData,
  onFillableDataChange 
}) {
  const [medicationRows, setMedicationRows] = useState(
    fillableData?.medication || [{ medications: '', status: '', remarks: '' }]
  );

  const [remarks, setRemarks] = useState({
    hygiene: fillableData?.hygiene || '',
    sleepPattern: fillableData?.sleepPattern || '',
    dietFood: fillableData?.dietFood || ''
  });

  // Sync state with prop changes (when restoring from localStorage)
  useEffect(() => {
    if (fillableData?.medication) {
      setMedicationRows(fillableData.medication);
    }
  }, [fillableData?.medication]);

  useEffect(() => {
    if (fillableData?.remarks) {
      setRemarks({
        hygiene: fillableData.remarks.hygiene || '',
        sleepPattern: fillableData.remarks.sleepPattern || '',
        dietFood: fillableData.remarks.dietFood || ''
      });
    }
  }, [fillableData?.remarks]);

  const handleMedicationChange = (index, field, value) => {
    const newRows = [...medicationRows];
    newRows[index][field] = value;
    setMedicationRows(newRows);
    onFillableDataChange('medication', newRows);
  };

  const addMedicationRow = () => {
    const newRows = [...medicationRows, { medications: '', status: '', remarks: '' }];
    setMedicationRows(newRows);
    onFillableDataChange('medication', newRows);
  };

  const removeMedicationRow = (index) => {
    if (medicationRows.length > 1) {
      const newRows = medicationRows.filter((_, i) => i !== index);
      setMedicationRows(newRows);
      onFillableDataChange('medication', newRows);
    }
  };

  const handleRemarksChange = (field, value) => {
    const newRemarks = { ...remarks, [field]: value };
    setRemarks(newRemarks);
    onFillableDataChange('remarks', newRemarks);
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
              minHeight: '150px',
              '& .recharts-responsive-container': {
                width: '100% !important',
                minHeight: '150px'
              }
            }
          }}
        >
          <ResponsiveContainer width="100%" height={150}>
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
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom color="primary">
          Section 1: Health Report
        </Typography>

        {/* Health Score and Indicator */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Typography variant="h6">
            Total Health Score:
          </Typography>
          <Typography variant="h4" color="primary">
            {healthScore}%
          </Typography>
          <Chip
            label={indicator}
            color={getIndicatorColor(indicator)}
            size="large"
          />
        </Box>

        {/* Pie Charts Grid - 2 columns instead of 3 */}
        <Grid 
          container 
          spacing={2} 
          mb={3} 
          id="health-charts" 
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
            {renderPieChart(pieChartData?.medication, 'Medication Adherence')}
          </Grid>
          <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
            {renderPieChart(pieChartData?.sleep, 'Sleep Pattern')}
          </Grid>
          <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
            {renderPieChart(pieChartData?.diet, 'Diet and Food')}
          </Grid>
          <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
            {renderPieChart(pieChartData?.dental, 'Dental Hygiene')}
          </Grid>
          <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
            {renderPieChart(pieChartData?.shower, 'Shower Compliance')}
          </Grid>
          <Grid item xs={12} md={6} sx={{ minWidth: 0, overflow: 'visible' }}>
            {renderPieChart(pieChartData?.healthAppointments, 'Health Appointments')}
          </Grid>
        </Grid>

        {/* Fillable Table */}
        <div className="html2pdf__page-break"></div>
        <Typography variant="h6" gutterBottom>
          Health Assessment
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }} id="health-assessment-table" className="pdf-avoid-break">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Details</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Medication Row */}
              <TableRow>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <strong>Medication</strong>
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Box>
                    {medicationRows.map((row, index) => (
                      <Box key={index} display="flex" gap={1} mb={1} alignItems="center">
                        <TextField
                          size="small"
                          placeholder="Medications taken this month"
                          value={row.medications}
                          onChange={(e) => handleMedicationChange(index, 'medications', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          placeholder="Status"
                          value={row.status}
                          onChange={(e) => handleMedicationChange(index, 'status', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          placeholder="Remarks"
                          value={row.remarks}
                          onChange={(e) => handleMedicationChange(index, 'remarks', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        {medicationRows.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => removeMedicationRow(index)}
                            color="error"
                            className="pdf-hide"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addMedicationRow}
                      sx={{ mt: 1 }}
                      className="pdf-hide"
                    >
                      Add Medication
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>

              {/* Hygiene Row */}
              <TableRow>
                <TableCell sx={{ verticalAlign: 'top' }}><strong>Hygiene</strong></TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Personal hygiene assessment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Hygiene remarks"
                      value={remarks.hygiene}
                      onChange={(e) => handleRemarksChange('hygiene', e.target.value)}
                    />
                  </Box>
                </TableCell>
              </TableRow>

              {/* Sleep Pattern Row */}
              <TableRow id="sleep-pattern-row" className="pdf-avoid-break">
                <TableCell sx={{ verticalAlign: 'top' }}><strong>Sleep Pattern</strong></TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Sleep quality and timing assessment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Sleep pattern remarks"
                      value={remarks.sleepPattern}
                      onChange={(e) => handleRemarksChange('sleepPattern', e.target.value)}
                    />
                  </Box>
                </TableCell>
              </TableRow>

              {/* Diet and Food Row */}
              <TableRow>
                <TableCell sx={{ verticalAlign: 'top' }}><strong>Diet and Food</strong></TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Dietary habits and nutrition assessment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Diet and food remarks"
                      value={remarks.dietFood}
                      onChange={(e) => handleRemarksChange('dietFood', e.target.value)}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Medical Appointments Summary */}
        <Typography variant="h6" gutterBottom>
          Medical Appointments Summary
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Nature</strong></TableCell>
                <TableCell><strong>Compliance</strong></TableCell>
                <TableCell><strong>Remarks</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryTables?.healthAppointments?.length > 0 ? (
                summaryTables.healthAppointments.map((apt, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.date}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.type}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.nature}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.compliance}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>{apt.remarks}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ verticalAlign: 'top' }}>
                    No medical appointments recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

export default HealthReport;
