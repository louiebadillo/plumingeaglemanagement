/**
 * Geofencing: detect which facility the device is inside (circle around lat/lng + radius).
 * Used only for UX — access control must still be enforced with Supabase RLS.
 */

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

/**
 * @returns {Promise<string|null>} facility id (uuid) or null if outside all fences / error
 */
export const getCurrentFacilityFromGeofencing = () => {
  if (inFlightRead) {
    return inFlightRead;
  }

  inFlightRead = (async () => {
    try {
      const now = Date.now();
      if (
        geofencingCache.timestamp > 0 &&
        now - geofencingCache.timestamp < geofencingCache.ttl
      ) {
        return geofencingCache.facilityId;
      }

      const position = await requestLocationPermission();
      const employeeLat = position.coords.latitude;
      const employeeLng = position.coords.longitude;

      const { supabase } = await import('../lib/supabase');

      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, geofence_latitude, geofence_longitude, geofence_radius_meters');

      if (facilitiesError) {
        console.error('❌ Failed to fetch facilities for geofencing:', facilitiesError);
        return null;
      }

      if (!facilities || facilities.length === 0) {
        geofencingCache = {
          facilityId: null,
          timestamp: Date.now(),
          ttl: geofencingCache.ttl,
        };
        return null;
      }

      // If multiple facilities match (overlapping geofences), pick the closest one.
      let bestMatch = null; // { id: string, distance: number }

      for (const facility of facilities) {
        const lat = facility.geofence_latitude;
        const lng = facility.geofence_longitude;
        const radius = facility.geofence_radius_meters;
        if (lat == null || lng == null || radius == null || Number(radius) <= 0) {
          continue;
        }

        const distance = calculateDistance(
          employeeLat,
          employeeLng,
          Number(lat),
          Number(lng)
        );

        if (distance <= Number(radius)) {
          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = { id: facility.id, distance };
          }
        }
      }

      if (bestMatch) {
        geofencingCache = {
          facilityId: bestMatch.id,
          timestamp: Date.now(),
          ttl: geofencingCache.ttl,
        };
        return bestMatch.id;
      }

      geofencingCache = {
        facilityId: null,
        timestamp: Date.now(),
        ttl: geofencingCache.ttl,
      };
      return null;
    } catch (error) {
      console.error('❌ Error detecting facility from geofencing:', error);
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
