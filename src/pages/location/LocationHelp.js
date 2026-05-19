import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { submitLocationHelpRequest } from '../../services/locationHelpRequestsService';
import { useHistory } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import {
  clearGeofencingCache,
  getCurrentFacilityFromGeofencing,
  getLastGeofenceReport,
  requestLocationPermission,
} from '../../utils/geofencing';
import { formatLocationReportText } from '../../utils/locationReport';

function LocationHelp() {
  const history = useHistory();
  const { userProfile } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchedFacilityId, setMatchedFacilityId] = useState(null);
  const [report, setReport] = useState(null);
  const [geoPermissionState, setGeoPermissionState] = useState('unknown');
  const [geoErrorMessage, setGeoErrorMessage] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sending, setSending] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const [windowsHelpExpanded, setWindowsHelpExpanded] = useState(false);

  const employeeName =
    [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') || 'Employee';

  useEffect(() => {
    let permissionStatus = null;
    let cancelled = false;

    const syncPermission = async () => {
      try {
        if (!navigator?.permissions?.query) {
          if (!cancelled) setGeoPermissionState('unsupported');
          return;
        }
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (!cancelled) setGeoPermissionState(permissionStatus.state || 'unknown');
        permissionStatus.onchange = () => {
          if (!cancelled) setGeoPermissionState(permissionStatus.state || 'unknown');
        };
      } catch {
        if (!cancelled) setGeoPermissionState('unknown');
      }
    };

    syncPermission();
    return () => {
      cancelled = true;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const runLocationCheck = useCallback(async () => {
    setGeoErrorMessage(null);
    clearGeofencingCache();
    const facilityId = await getCurrentFacilityFromGeofencing();
    const geoReport = getLastGeofenceReport();
    setMatchedFacilityId(facilityId);
    setReport(geoReport);
    if (geoReport?.locationAccess?.browserPermission) {
      setGeoPermissionState(geoReport.locationAccess.browserPermission);
    }

    if (geoReport?.error?.message) {
      setGeoErrorMessage(geoReport.error.message);
    } else if (!facilityId && geoReport?.nearest) {
      setGeoErrorMessage(null);
    }

    return { facilityId, geoReport };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await runLocationCheck();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runLocationCheck]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setCopySuccess(false);
    try {
      await runLocationCheck();
    } catch (err) {
      setGeoErrorMessage(err?.message || 'Could not refresh location.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEnableLocation = async () => {
    setRefreshing(true);
    setCopySuccess(false);
    setGeoErrorMessage(null);
    try {
      await requestLocationPermission();
      await runLocationCheck();
    } catch (err) {
      setGeoErrorMessage(err?.message || 'Location permission was denied or unavailable.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendToAdmin = async () => {
    if (!userProfile?.id) {
      setSendError('You must be logged in to send a request.');
      return;
    }

    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      let latestReport = report;
      if (!latestReport?.device) {
        await runLocationCheck();
        latestReport = getLastGeofenceReport();
      }

      const reportText = formatLocationReportText(latestReport, {
        userEmail: userProfile?.email,
        userName: employeeName,
      });

      await submitLocationHelpRequest({
        userId: userProfile.id,
        userEmail: userProfile.email,
        userDisplayName: employeeName,
        reportText,
        reportPayload: latestReport,
        matchedFacilityId: latestReport?.bestMatch?.id || null,
        matchedFacilityName: latestReport?.bestMatch?.name || null,
        device: latestReport?.device
          ? {
              lat: latestReport.device.lat,
              lng: latestReport.device.lng,
              accuracyMeters: latestReport.device.accuracyMeters,
            }
          : null,
      });

      setSendSuccess(true);
    } catch (err) {
      console.error(err);
      setSendError(
        err?.message ||
          'Could not send request. Ask an administrator to set up location requests in the database.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleCopyReport = async () => {
    const text = formatLocationReportText(report, {
      userEmail: userProfile?.email,
      userName: employeeName,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    } catch {
      window.prompt('Copy this location report and send it to your administrator:', text);
    }
  };

  const matchedFacilityName = report?.bestMatch?.name || null;
  const isInsideFacility = Boolean(matchedFacilityId);
  const isDenied = geoPermissionState === 'denied';

  const facilityRows = useMemo(() => {
    return (report?.facilities || [])
      .filter((f) => !f.skipped)
      .slice()
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }, [report]);

  const statusSeverity = isDenied ? 'error' : isInsideFacility ? 'success' : 'warning';
  const statusTitle = isDenied
    ? 'Location is blocked'
    : isInsideFacility
      ? `You are detected at ${matchedFacilityName || 'a facility'}`
      : 'No facility detected';

  const statusDescription = isDenied
    ? 'Chrome is not allowed to use your location for this site. Clients will not appear on the Dashboard until location is allowed.'
    : isInsideFacility
      ? 'Your device is inside this facility’s area. Return to the Dashboard to see today’s clients.'
      : report?.nearest
        ? `Your device is about ${report.nearest.distanceMeters} m from ${report.nearest.name} (geofence radius ${report.nearest.radiusMeters} m). Ask an administrator to review geofence settings if you are on site.`
        : 'Your device is not inside any facility geofence. Clients are hidden until you are detected on site.';

  const highAccuracyWarning =
    report?.device?.accuracyMeters &&
    report?.nearest?.radiusMeters &&
    report.device.accuracyMeters > report.nearest.radiusMeters;

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={28} />
        <Typography variant="h6">Checking your location…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Location help
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This page shows which facility your work laptop thinks you are at. The Dashboard uses this
        to show the correct clients for your site.
      </Typography>

      <Alert severity={statusSeverity} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {statusTitle}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {statusDescription}
        </Typography>
        {geoErrorMessage && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Details: {geoErrorMessage}
          </Typography>
        )}
      </Alert>

      {highAccuracyWarning && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your browser’s location estimate is uncertain (about{' '}
          {Math.round(report.device.accuracyMeters)} m). Facility laptops often need a larger
          geofence or an adjusted pin—send a request to your administrator below.
        </Alert>
      )}

      {sendSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your location report was sent to administrators. They will review it under Location
          requests.
        </Alert>
      )}
      {sendError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSendError(null)}>
          {sendError}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }} flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={refreshing ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Checking…' : 'Refresh location'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleEnableLocation}
          disabled={refreshing}
          startIcon={<MyLocationIcon />}
        >
          {isDenied ? 'Retry location permission' : 'Request location again'}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          onClick={handleSendToAdmin}
          disabled={sending || refreshing}
        >
          {sending ? 'Sending…' : 'Send to admin'}
        </Button>
        <Button
          variant="outlined"
          startIcon={copySuccess ? <CheckCircleIcon /> : <CopyIcon />}
          onClick={handleCopyReport}
          color={copySuccess ? 'success' : 'primary'}
        >
          {copySuccess ? 'Copied!' : 'Copy report'}
        </Button>
        <Button
          variant="text"
          startIcon={<DashboardIcon />}
          onClick={() => history.push('/app/dashboard')}
        >
          Go to Dashboard
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Location access
          </Typography>
          {report?.locationAccess ? (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Chrome (this site):</strong>{' '}
                {report.locationAccess.browserPermissionLabel}
              </Typography>
              <Typography variant="body2">
                <strong>Position received:</strong>{' '}
                {report.locationAccess.positionObtained ? 'Yes' : 'No'}
              </Typography>
              {report.locationAccess.errorMessage && (
                <Typography variant="body2" color="error">
                  <strong>Error:</strong> {report.locationAccess.errorMessage}
                  {report.locationAccess.errorCode != null &&
                    ` (code ${report.locationAccess.errorCode})`}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {report.locationAccess.osLocationHint}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                The app cannot read the Windows &quot;Location services&quot; switch directly.
                If permission is allowed but position is No, check Windows Settings → Privacy →
                Location.
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Run Refresh location to check site permission and whether a position is available.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your device
          </Typography>
          {report?.device ? (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Latitude:</strong> {report.device.lat.toFixed(6)}
              </Typography>
              <Typography variant="body2">
                <strong>Longitude:</strong> {report.device.lng.toFixed(6)}
              </Typography>
              <Typography variant="body2">
                <strong>Accuracy:</strong>{' '}
                {Number.isFinite(report.device.accuracyMeters)
                  ? `± ${Math.round(report.device.accuracyMeters)} m`
                  : 'Unknown'}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                sx={{ alignSelf: 'flex-start', mt: 1 }}
                href={`https://www.google.com/maps?q=${report.device.lat},${report.device.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on Google Maps
              </Button>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Location could not be read. Allow location in Chrome and tap Refresh.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distance to each facility
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Inside</strong> means your device is within that facility’s geofence. If two
            overlap, the app uses the closest center.
          </Typography>
          {facilityRows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No facilities with geofencing configured.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Facility</TableCell>
                    <TableCell align="right">Distance</TableCell>
                    <TableCell align="right">Radius</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {facilityRows.map((row) => (
                    <TableRow
                      key={row.id}
                      selected={report?.bestMatch?.id === row.id && row.inside}
                    >
                      <TableCell>{row.name || row.id}</TableCell>
                      <TableCell align="right">{row.distanceMeters} m</TableCell>
                      <TableCell align="right">{row.radiusMeters} m</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={row.inside ? 'Inside' : 'Outside'}
                          color={row.inside ? 'success' : 'default'}
                          variant={row.inside ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Button
            fullWidth
            onClick={() => setHelpExpanded((v) => !v)}
            endIcon={
              <ExpandMoreIcon
                sx={{
                  transform: helpExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            }
            sx={{ justifyContent: 'space-between', textTransform: 'none', py: 1 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              How to enable location in Chrome
            </Typography>
          </Button>
          <Collapse in={helpExpanded}>
            <Typography variant="body2" component="ol" sx={{ pl: 2.5, mt: 1 }}>
              <li>Click the lock (or tune) icon in the address bar.</li>
              <li>Open <strong>Site settings</strong>.</li>
              <li>Set <strong>Location</strong> to <strong>Allow</strong>.</li>
              <li>Return here and tap <strong>Refresh location</strong>.</li>
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Also ensure Windows <strong>Location services</strong> are on. If clients still do not
              appear, use <strong>Send to admin</strong> or copy the report for your administrator.
            </Typography>
          </Collapse>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Button
            fullWidth
            onClick={() => setWindowsHelpExpanded((v) => !v)}
            endIcon={
              <ExpandMoreIcon
                sx={{
                  transform: windowsHelpExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            }
            sx={{ justifyContent: 'space-between', textTransform: 'none', py: 1 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              How to enable location services in Windows
            </Typography>
          </Button>
          <Collapse in={windowsHelpExpanded}>
            <Typography variant="body2" component="ol" sx={{ pl: 2.5, mt: 1, mb: 0 }}>
              <li>Open <strong>Settings</strong> (Windows key + I).</li>
              <li>Go to <strong>Privacy &amp; security</strong> → <strong>Location</strong>.</li>
              <li>Turn <strong>Location services</strong> <strong>On</strong>.</li>
              <li>
                Turn <strong>Let desktop apps access your location</strong> <strong>On</strong>{' '}
                (if you see it).
              </li>
              <li>Close Settings, reopen Chrome, and tap <strong>Refresh location</strong> here.</li>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You still need to allow location for this website in Chrome (see section above).
            </Typography>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LocationHelp;
