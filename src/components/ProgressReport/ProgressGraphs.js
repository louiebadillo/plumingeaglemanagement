import React, { useMemo, useRef } from 'react';
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

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Least-squares line y = intercept + slope * x, x = row index in trendData; only non-NaN y used. */
function computeLinearTrend(trendData, dataKey) {
  const pts = [];
  trendData.forEach((d, i) => {
    const y = Number(d[dataKey]);
    if (!Number.isNaN(y)) pts.push({ x: i, y });
  });
  if (pts.length < 2) return { slope: null, intercept: null };
  const n = pts.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (const p of pts) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-9) return { slope: null, intercept: null };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const meanX = sumX / n;
  const meanY = sumY / n;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

function buildChartDataWithTrend(trendData, dataKey) {
  const trendField = `${dataKey}Trend`;
  const { slope, intercept } = computeLinearTrend(trendData, dataKey);
  if (intercept == null || slope == null) {
    return {
      data: trendData.map((d) => ({ ...d, [trendField]: null })),
      slope: null,
    };
  }
  const data = trendData.map((d, idx) => ({
    ...d,
    [trendField]: clamp(intercept + slope * idx, 0, 100),
  }));
  return { data, slope };
}

function formatSlopeShort(slope) {
  if (slope == null || Number.isNaN(slope)) return 'n/a';
  if (slope === 0) return '0';
  const s = slope.toFixed(2);
  return slope > 0 ? `+${s}` : s;
}

function ProgressGraphs({ trendData, sectionAverages = {} }) {
  const chartRef = useRef(null);

  const chartsPrepared = useMemo(() => {
    if (!trendData?.length) {
      return {
        health: { data: [], slope: null },
        routine: { data: [], slope: null },
        wellbeing: { data: [], slope: null },
        behaviour: { data: [], slope: null },
      };
    }
    return {
      health: buildChartDataWithTrend(trendData, 'health'),
      routine: buildChartDataWithTrend(trendData, 'routine'),
      wellbeing: buildChartDataWithTrend(trendData, 'wellbeing'),
      behaviour: buildChartDataWithTrend(trendData, 'behaviour'),
    };
  }, [trendData]);

  const renderLineChart = (dataKey, title, color, averageScore, prepared) => {
    const { data: chartData, slope } = prepared;
    const trendField = `${dataKey}Trend`;

    // Build the month label from the actual dates in the data so the day-only
    // ticks still tell the reader which month they belong to.
    // Single month → "May 2026"; spans months → "May – Jun 2026" /
    // "Dec 2025 – Jan 2026".
    const monthLabel = (() => {
      if (!chartData || chartData.length === 0) return '';
      const seen = [];
      const seenKeys = new Set();
      for (const row of chartData) {
        const d = new Date(row.date);
        if (Number.isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        seen.push({
          year: d.getFullYear(),
          monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
        });
      }
      if (seen.length === 0) return '';
      if (seen.length === 1) return `${seen[0].monthShort} ${seen[0].year}`;
      const first = seen[0];
      const last = seen[seen.length - 1];
      if (first.year === last.year) {
        return `${first.monthShort} – ${last.monthShort} ${last.year}`;
      }
      return `${first.monthShort} ${first.year} – ${last.monthShort} ${last.year}`;
    })();

    return (
      <Box
        sx={{
          mb: 3,
          width: '100%',
          '@media screen': {
            minWidth: 0,
            overflow: 'visible',
            '& .recharts-wrapper': {
              overflow: 'visible !important',
            },
            '& .recharts-surface': {
              overflow: 'visible !important',
            },
          },
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" component="div" gutterBottom>
            {title}
            {averageScore != null && (
              <Typography
                component="span"
                variant="subtitle1"
                color="primary"
                sx={{ ml: 1, fontWeight: 700 }}
              >
                {' '}
                ({averageScore}% avg)
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trend slope: {formatSlopeShort(slope)}
          </Typography>
        </Box>
        <Box
          sx={{
            width: '100%',
            '@media screen': {
              minHeight: '300px',
              '& .recharts-responsive-container': {
                width: '100% !important',
                minHeight: '300px',
              },
            },
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                interval={0}
                tick={{ fontSize: 11 }}
                height={50}
                label={{ value: monthLabel, position: 'insideBottom', offset: -2 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (Number.isNaN(date.getTime())) return value;
                  return String(date.getDate());
                }}
              />
              <YAxis
                domain={[0, 100]}
                label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
                labelFormatter={(date) => {
                  const dateObj = new Date(date);
                  return `${dateObj.getDate()}, ${dateObj.toLocaleDateString('en-US', { month: 'short' })}`;
                }}
              />
              <Legend />
              <Line
                name="Daily score"
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                name="Trend line"
                type="linear"
                dataKey={trendField}
                stroke={color}
                strokeOpacity={0.9}
                strokeDasharray="6 4"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    );
  };

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
                '@media screen': {
                  '& .MuiGrid-item': {
                    minWidth: 0,
                    overflow: 'visible',
                  },
                },
              }}
            >
              <Grid item xs={12} md={6} className="pdf-avoid-break" sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderLineChart(
                  'health',
                  'Health Score Trend',
                  '#4caf50',
                  sectionAverages.health,
                  chartsPrepared.health
                )}
              </Grid>
              <Grid item xs={12} md={6} className="pdf-avoid-break" sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderLineChart(
                  'routine',
                  'Routine Score Trend',
                  '#2196f3',
                  sectionAverages.routine,
                  chartsPrepared.routine
                )}
              </Grid>
              <Grid item xs={12} md={6} className="pdf-avoid-break" sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderLineChart(
                  'wellbeing',
                  'Well-Being Score Trend',
                  '#ff9800',
                  sectionAverages.wellbeing,
                  chartsPrepared.wellbeing
                )}
              </Grid>
              <Grid item xs={12} md={6} className="pdf-avoid-break" sx={{ minWidth: 0, overflow: 'visible' }}>
                {renderLineChart(
                  'behaviour',
                  'Behaviour Score Trend',
                  '#f44336',
                  sectionAverages.behaviour,
                  chartsPrepared.behaviour
                )}
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressGraphs;
