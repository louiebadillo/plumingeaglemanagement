/**
 * Geofencing: detect which facility the device is inside (circle around lat/lng + radius).
 * Used only for UX — access control must still be enforced with Supabase RLS.
 */

const LOG_TAG = '[PEM-GEO]';
// Soft cap so a noisy facility list doesn't spam the console.
const MAX_FACILITIES_LOGGED = 20;

const logInfo = (...args) => {
  try { console.info(LOG_TAG, ...args); } catch (e) { /* ignore */ }
};
const logWarn = (...args) => {
  try { console.warn(LOG_TAG, ...args); } catch (e) { /* ignore */ }
};
const logError = (...args) => {
  try { console.error(LOG_TAG, ...args); } catch (e) { /* ignore */ }
};

/** Last decision diagnostic — exposed via window.pemDebug for on-site troubleshooting. */
let lastGeofenceReport = null;

// Cache: facilityId is UUID string when inside a fence, null when outside / unresolved.
// timestamp 0 means invalidated (e.g. clearGeofencingCache or initial).
let geofencingCache = {
  facilityId: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
};

/** Single in-flight read so Layout + Dashboard do not double-call getCurrentPosition. */
let inFlightRead = null;

/** Call when you need a fresh GPS check (e.g. opening dashboard / my-reports). */
export const clearGeofencingCache = () => {
  geofencingCache = { facilityId: null, timestamp: 0, ttl: 5 * 60 * 1000 };
  inFlightRead = null;
};

/** Returns the most recent diagnostic record (or null if no lookup has happened). */
export const getLastGeofenceReport = () => lastGeofenceReport;

/**
 * @returns {Promise<string|null>} facility id (uuid) or null if outside all fences / error
 */
export const getCurrentFacilityFromGeofencing = () => {
  if (inFlightRead) {
    return inFlightRead;
  }

  inFlightRead = (async () => {
    const startedAt = Date.now();
    const report = {
      startedAt: new Date(startedAt).toISOString(),
      cacheHit: false,
      result: null,
      bestMatch: null,
      nearest: null,
      device: null,
      facilities: [],
      error: null,
    };

    try {
      const now = Date.now();
      if (
        geofencingCache.timestamp > 0 &&
        now - geofencingCache.timestamp < geofencingCache.ttl
      ) {
        report.cacheHit = true;
        report.cacheAgeMs = now - geofencingCache.timestamp;
        report.result = geofencingCache.facilityId;
        logInfo('Cache hit; returning cached facility', {
          facilityId: report.result,
          cacheAgeSec: Math.round(report.cacheAgeMs / 1000),
        });
        lastGeofenceReport = report;
        return geofencingCache.facilityId;
      }

      let position;
      try {
        position = await requestLocationPermission();
      } catch (geoError) {
        report.error = {
          stage: 'getCurrentPosition',
          name: geoError?.name,
          code: geoError?.code,
          message: geoError?.message,
        };
        logError(
          'Failed to get device position. Common causes: location permission denied, ' +
            'no GPS hardware, or browser location services off.',
          report.error
        );
        lastGeofenceReport = report;
        geofencingCache = { facilityId: null, timestamp: Date.now(), ttl: geofencingCache.ttl };
        return null;
      }
      const employeeLat = position.coords.latitude;
      const employeeLng = position.coords.longitude;
      const accuracyMeters = Number(position.coords.accuracy || 0);
      report.device = {
        lat: employeeLat,
        lng: employeeLng,
        accuracyMeters,
        positionTimestamp: position.timestamp || null,
      };
      logInfo('Device position', report.device);

      const { supabase } = await import('../lib/supabase');

      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, name, geofence_latitude, geofence_longitude, geofence_radius_meters');

      if (facilitiesError) {
        report.error = { stage: 'select facilities', message: facilitiesError.message };
        logError('Failed to fetch facilities for geofencing.', facilitiesError);
        lastGeofenceReport = report;
        return null;
      }

      if (!facilities || facilities.length === 0) {
        logWarn('No facilities found in DB. Nothing to geofence against.');
        geofencingCache = {
          facilityId: null,
          timestamp: Date.now(),
          ttl: geofencingCache.ttl,
        };
        lastGeofenceReport = report;
        return null;
      }

      // If multiple facilities match (overlapping geofences), pick the closest one.
      let bestMatch = null; // { id, name, distance, radius }
      let nearest = null; // { id, name, distance, radius }

      for (const facility of facilities) {
        const lat = facility.geofence_latitude;
        const lng = facility.geofence_longitude;
        const radius = facility.geofence_radius_meters;

        if (lat == null || lng == null || radius == null || Number(radius) <= 0) {
          report.facilities.push({
            id: facility.id,
            name: facility.name,
            skipped: true,
            reason: 'missing or invalid geofence configuration',
          });
          continue;
        }

        const distance = calculateDistance(
          employeeLat,
          employeeLng,
          Number(lat),
          Number(lng)
        );
        const radiusNum = Number(radius);
        const inside = distance <= radiusNum;

        report.facilities.push({
          id: facility.id,
          name: facility.name,
          distanceMeters: Math.round(distance),
          radiusMeters: radiusNum,
          inside,
        });

        if (!nearest || distance < nearest.distance) {
          nearest = { id: facility.id, name: facility.name, distance, radius: radiusNum };
        }

        if (inside) {
          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = {
              id: facility.id,
              name: facility.name,
              distance,
              radius: radiusNum,
            };
          }
        }
      }

      report.bestMatch = bestMatch
        ? {
            id: bestMatch.id,
            name: bestMatch.name,
            distanceMeters: Math.round(bestMatch.distance),
            radiusMeters: bestMatch.radius,
          }
        : null;
      report.nearest = nearest
        ? {
            id: nearest.id,
            name: nearest.name,
            distanceMeters: Math.round(nearest.distance),
            radiusMeters: nearest.radius,
          }
        : null;

      // Surface a clear warning when the GPS uncertainty is larger than the
      // geofence radius — this is the #1 cause of a phone/laptop being inside
      // the building but reported as outside any fence (e.g. Wi-Fi-based
      // location with ~3000 m accuracy).
      if (
        nearest &&
        Number.isFinite(accuracyMeters) &&
        accuracyMeters > 0 &&
        accuracyMeters > nearest.radius
      ) {
        logWarn(
          `Device GPS accuracy (${Math.round(accuracyMeters)} m) is larger than the ` +
            `nearest facility's radius (${Math.round(nearest.radius)} m). The browser is ` +
            'likely using IP / Wi-Fi positioning instead of real GPS. Try a phone with ' +
            'GPS, enable OS-level Location Services, or increase the geofence radius.',
          {
            nearest: report.nearest,
            accuracyMeters: Math.round(accuracyMeters),
          }
        );
      }

      // Print a compact per-facility distance table to the console so the
      // on-site investigator can immediately see where the device is relative
      // to every facility.
      try {
        const tableRows = report.facilities
          .filter((f) => !f.skipped)
          .slice(0, MAX_FACILITIES_LOGGED)
          .map((f) => ({
            facility: f.name || f.id,
            distance_m: f.distanceMeters,
            radius_m: f.radiusMeters,
            inside: f.inside,
          }));
        if (tableRows.length > 0) {
          // eslint-disable-next-line no-console
          console.table(tableRows);
        }
        const skippedCount = report.facilities.filter((f) => f.skipped).length;
        if (skippedCount > 0) {
          logWarn(
            `${skippedCount} facility row(s) skipped because geofence_latitude / ` +
              'geofence_longitude / geofence_radius_meters are missing or zero.',
            report.facilities.filter((f) => f.skipped)
          );
        }
      } catch (e) {
        /* ignore console.table failures (some embedded shells) */
      }

      if (bestMatch) {
        logInfo('Matched facility', report.bestMatch);
        geofencingCache = {
          facilityId: bestMatch.id,
          timestamp: Date.now(),
          ttl: geofencingCache.ttl,
        };
        report.result = bestMatch.id;
        lastGeofenceReport = report;
        return bestMatch.id;
      }

      logWarn(
        'No facility matched. Nearest facility shown below — if you are physically ' +
          'inside that facility, the radius may be too small or the facility coordinates ' +
          'in the database are wrong.',
        { nearest: report.nearest }
      );

      geofencingCache = {
        facilityId: null,
        timestamp: Date.now(),
        ttl: geofencingCache.ttl,
      };
      report.result = null;
      lastGeofenceReport = report;
      return null;
    } catch (error) {
      report.error = { stage: 'unexpected', message: error?.message };
      logError('Unexpected error detecting facility from geofencing.', error);
      lastGeofenceReport = report;
      return null;
    }
  })();

  const p = inFlightRead;
  p.finally(() => {
    if (inFlightRead === p) {
      inFlightRead = null;
    }
  });

  return p;
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isLocationInGeofence = (lat, lng, facilityLat, facilityLng, radiusMeters) => {
  const R = 6371000;
  const dLat = (lat - facilityLat) * Math.PI / 180;
  const dLng = (lng - facilityLng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(facilityLat * Math.PI / 180) *
      Math.cos(lat * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= radiusMeters;
};

export const requestLocationPermission = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
};
