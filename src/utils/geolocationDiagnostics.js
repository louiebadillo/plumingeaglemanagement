/**
 * Browser-side location access diagnostics for employee reports.
 *
 * Note: Web apps cannot read Windows/macOS "Location services" toggles directly.
 * We report Chrome/site permission + whether a GPS fix was returned, and infer
 * likely OS-level issues from error codes.
 */

const PERMISSION_LABELS = {
  granted: 'Allowed for this website (Chrome site permission)',
  denied: 'Blocked for this website (Chrome site permission)',
  prompt: 'Not decided yet — Chrome will ask when location is requested',
  unsupported: 'Geolocation not supported in this browser',
  unknown: 'Unknown — permissions API unavailable',
};

export async function queryBrowserGeolocationPermission() {
  if (!navigator?.geolocation) {
    return { state: 'unsupported', label: PERMISSION_LABELS.unsupported };
  }
  if (!navigator?.permissions?.query) {
    return { state: 'unknown', label: PERMISSION_LABELS.unknown };
  }
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    const state = result.state || 'unknown';
    return {
      state,
      label: PERMISSION_LABELS[state] || `Permission state: ${state}`,
    };
  } catch {
    return { state: 'unknown', label: PERMISSION_LABELS.unknown };
  }
}

/**
 * @param {{ permission: { state: string, label: string }, positionObtained: boolean, geoError?: { code?: number, name?: string, message?: string } | null }} params
 */
export function buildLocationAccessDiagnostics({ permission, positionObtained, geoError = null }) {
  const browserPermission = permission?.state || 'unknown';
  const browserPermissionLabel = permission?.label || PERMISSION_LABELS.unknown;
  const code = geoError?.code;

  let status = 'ok';
  let osLocationHint =
    'Web apps cannot read the Windows "Location services" switch directly. Use the signals below.';

  if (browserPermission === 'unsupported') {
    status = 'unsupported';
    osLocationHint = 'This browser does not support geolocation.';
  } else if (browserPermission === 'denied') {
    status = 'site_blocked';
    osLocationHint =
      'This website is blocked from using location. In Chrome: lock icon → Site settings → Location → Allow. ' +
      'Windows Location can be ON but the site must still be allowed.';
  } else if (!positionObtained && code === 1) {
    status = 'site_blocked';
    osLocationHint =
      'The browser denied the location request. Check Chrome site permission (lock icon → Location → Allow).';
  } else if (!positionObtained && code === 2) {
    status = 'position_unavailable';
    osLocationHint =
      'No position fix (often Windows Location services OFF, no Wi‑Fi, or laptop cannot estimate location). ' +
      'On Windows: Settings → Privacy & security → Location → Location services ON, and allow desktop apps / Chrome if listed.';
  } else if (!positionObtained && code === 3) {
    status = 'timeout';
    osLocationHint =
      'Location request timed out. Ensure Wi‑Fi is connected and try again; facility laptops often need a few seconds.';
  } else if (!positionObtained && geoError?.message) {
    status = 'error';
    osLocationHint = geoError.message;
  } else if (browserPermission === 'prompt' && !positionObtained) {
    status = 'prompt';
    osLocationHint = 'Tap "Request location again" and choose Allow when Chrome prompts.';
  } else if (positionObtained) {
    status = 'ok';
    osLocationHint =
      'Chrome returned a location fix. System location is working from the browser\'s perspective ' +
      '(site allowed and a position was read).';
  } else if (browserPermission === 'granted' && !positionObtained) {
    status = 'unknown_failure';
    osLocationHint =
      'Site permission is allowed but no coordinates were returned. Check Windows Location services and Wi‑Fi.';
  }

  const summaryParts = [browserPermissionLabel];
  if (positionObtained) {
    summaryParts.push('Position received');
  } else if (geoError?.message) {
    summaryParts.push(geoError.message);
  }

  return {
    browserPermission,
    browserPermissionLabel,
    positionObtained: Boolean(positionObtained),
    errorCode: code ?? null,
    errorName: geoError?.name ?? null,
    errorMessage: geoError?.message ?? null,
    status,
    osLocationHint,
    summary: summaryParts.join(' · '),
  };
}

export async function collectLocationAccessSnapshot({ positionObtained = false, geoError = null } = {}) {
  const permission = await queryBrowserGeolocationPermission();
  return buildLocationAccessDiagnostics({ permission, positionObtained, geoError });
}
