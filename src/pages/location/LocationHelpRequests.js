import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import {
  CheckCircle as ResolveIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useSupabase } from '../../context/SupabaseContext';
import {
  fetchLocationHelpRequests,
  resolveLocationHelpRequest,
} from '../../services/locationHelpRequestsService';

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function LocationHelpRequests() {
  const { userProfile } = useSupabase();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');
  const [selected, setSelected] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLocationHelpRequests({ statusFilter });
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to load location requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (requestId) => {
    if (!userProfile?.id) return;
    setResolvingId(requestId);
    try {
      await resolveLocationHelpRequest(requestId, userProfile.id);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err?.message || 'Could not mark request as resolved.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Location requests
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Employees send these from Location Help when they cannot see clients or need geofence
        adjustments.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="location-request-filter-label">Show</InputLabel>
          <Select
            labelId="location-request-filter-label"
            label="Show"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="open">Open only</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </Select>
        </FormControl>
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {error.includes('location_help_requests') && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              The database table may not exist yet. Run the SQL migration in{' '}
              <code>supabase/migrations/20250518_location_help_requests.sql</code>.
            </Typography>
          )}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : requests.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <Typography color="text.secondary">
                {statusFilter === 'open'
                  ? 'No open location requests.'
                  : 'No requests match this filter.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Detected facility</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{formatWhen(row.created_at)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.user_display_name || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.user_email || row.user_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.matched_facility_name || (
                          <Typography variant="body2" color="text.secondary">
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.status}
                          color={row.status === 'open' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={() => setSelected(row)}>
                            View
                          </Button>
                          {row.status === 'open' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={
                                resolvingId === row.id ? (
                                  <CircularProgress size={14} color="inherit" />
                                ) : (
                                  <ResolveIcon />
                                )
                              }
                              disabled={resolvingId === row.id}
                              onClick={() => handleResolve(row.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Location request</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Stack spacing={2}>
              <Typography variant="body2">
                <strong>From:</strong> {selected.user_display_name} ({selected.user_email})
              </Typography>
              <Typography variant="body2">
                <strong>Sent:</strong> {formatWhen(selected.created_at)}
              </Typography>
              {selected.device_lat != null && selected.device_lng != null && (
                <Button
                  size="small"
                  variant="outlined"
                  href={`https://www.google.com/maps?q=${selected.device_lat},${selected.device_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Open device location on map
                </Button>
              )}
              <Typography
                component="pre"
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                }}
              >
                {selected.report_text}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {selected?.status === 'open' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleResolve(selected.id)}
              disabled={resolvingId === selected?.id}
            >
              Mark resolved
            </Button>
          )}
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LocationHelpRequests;
