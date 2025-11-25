import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

function ProgressGraphs({ trendData }) {
  const chartRef = useRef(null);

  const renderLineChart = (dataKey, title, color) => (
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
            minHeight: '300px',
            '& .recharts-responsive-container': {
              width: '100% !important',
              minHeight: '300px'
            }
          }
        }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}, ${date.toLocaleDateString('en-US', { month: 'short' })}`;
              }}
            />
            <YAxis 
              domain={[0, 100]}
              label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, title]}
              labelFormatter={(date) => {
                const dateObj = new Date(date);
                return `${dateObj.getDate()}, ${dateObj.toLocaleDateString('en-US', { month: 'short' })}`;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );

  // Always render Section 5, even if no data
  return (
    <Card sx={{ mb: 3, minHeight: '400px', mt: 4 }} ref={chartRef} id="section5-card">
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom color="primary" id="section5-title">
          Section 5: Progress by Day
        </Typography>
        
        {!trendData || trendData.length === 0 ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" color="textSecondary">
              No data available for trend analysis
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Daily progress trends across all assessment areas
            </Typography>

            <Grid 
              container 
              spacing={3} 
              id="section5-graphs"
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
              <Grid item xs={12} md={6} className="pdf-avoid-break" sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderLineChart('health', 'Health Score Trend', '#4caf50')}
              </Grid>
              <Grid item xs={12} md={6} className="pdf-avoid-break" sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderLineChart('routine', 'Routine Score Trend', '#2196f3')}
              </Grid>
              <Grid item xs={12} md={6} className="pdf-avoid-break" sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderLineChart('wellbeing', 'Well-Being Score Trend', '#ff9800')}
              </Grid>
              <Grid item xs={12} md={6} className="pdf-avoid-break" sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderLineChart('behaviour', 'Behaviour Score Trend', '#f44336')}
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressGraphs;
