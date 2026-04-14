import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip,
  Rating
} from '@mui/material';

function RoutineReport({ 
  routineScore, 
  indicator,
  routineChores = [],
  fillableData,
  onFillableDataChange 
}) {
  const [overallRemarks, setOverallRemarks] = useState(
    fillableData?.routineRemarks?.overallRemarks || ''
  );

  // Sync state with prop changes (when restoring from localStorage)
  useEffect(() => {
    if (fillableData?.routineRemarks?.overallRemarks !== undefined) {
      setOverallRemarks(fillableData.routineRemarks.overallRemarks);
    }
  }, [fillableData?.routineRemarks?.overallRemarks]);

  const handleOverallRemarksChange = (value) => {
    setOverallRemarks(value);
    onFillableDataChange('routineRemarks', { overallRemarks: value });
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
    <>
      <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom color="primary" id="section2-title">
          Section 2: Routine/Chores Adherence Report
        </Typography>

        {/* Routine Score and Indicator */}
        <Box id="routine-score-indicator" display="flex" alignItems="center" gap={2} mb={3}>
          <Typography variant="h6">
            Total Routine/Chores Average:
          </Typography>
          <Typography variant="h4" color="primary">
            {routineScore}%
          </Typography>
          <Chip
            label={indicator}
            color={getIndicatorColor(indicator)}
            size="large"
          />
        </Box>

        {/* Chores Table */}
        <Typography variant="h6" gutterBottom>
          Chores Performance Assessment
        </Typography>
        <TableContainer component={Paper} id="chores-performance-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Chores</strong></TableCell>
                <TableCell><strong>Star Rating (out of 5)</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routineChores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography variant="body2" color="textSecondary">
                      Generate the report to show average star ratings per chore for the selected range.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                routineChores.map((chore) => (
                  <TableRow key={chore.key}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {chore.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {chore.average != null ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating
                            value={chore.average}
                            precision={0.1}
                            readOnly
                            size="large"
                          />
                          <Typography variant="body2" color="textSecondary">
                            ({chore.average.toFixed(1)}/5.0)
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No ratings in this date range
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Overall Remarks */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overall Remarks
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Overall observations about routine and chores performance..."
            value={overallRemarks}
            onChange={(e) => handleOverallRemarksChange(e.target.value)}
          />
        </Box>
      </CardContent>
    </Card>
    </>
  );
}

export default RoutineReport;
