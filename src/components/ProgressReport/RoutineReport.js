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

  const chores = [
    { key: 'madeBed', name: 'Made Bed', score: 4.2 },
    { key: 'putClothesAway', name: 'Put Clothes Away', score: 3.8 },
    { key: 'clearedFloor', name: 'Cleared Bedroom Floor', score: 4.0 },
    { key: 'washedDishes', name: 'Washed Dishes', score: 3.6 },
    { key: 'additional', name: 'Additional Chores', score: 4.1 }
  ];

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
              {chores.filter(chore => chore.key !== 'additional').map((chore) => (
                <TableRow key={chore.key}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {chore.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Rating
                        value={chore.score}
                        precision={0.1}
                        readOnly
                        size="large"
                      />
                      <Typography variant="body2" color="textSecondary">
                        ({chore.score.toFixed(1)}/5.0)
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
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
