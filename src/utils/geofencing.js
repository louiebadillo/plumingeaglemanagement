/**
 * Geofencing utilities for facility detection
 * 
 * This module will handle detecting which facility an employee is currently at
 * based on their GPS location. Facilities will have geofencing coordinates/radius
 * that define their boundaries.
 * 
 * TODO: Implement geofencing detection
 * - Add geofencing coordinates (latitude, longitude, radius) to facilities table
 * - Use browser Geolocation API to get employee's current location
 * - Calculate distance from employee location to each facility's geofence
 * - Return the facility_id if employee is within a facility's geofence
 * - Handle cases where employee is not at any facility
 */

/**
 * Get the current facility ID based on employee's location (geofencing)
 * 
 * How geofencing works:
 * 1. Each facility has geofencing coordinates (latitude, longitude) and a radius
 * 2. We get the employee's current GPS location
 * 3. We check if the employee's location is within any facility's geofence (circle)
 * 4. Return the facility_id of the facility the employee is currently at
 * 
 * @returns {Promise<string|null>} The facility ID if employee is at a facility, null otherwise
 */
export const getCurrentFacilityFromGeofencing = async () => {
  try {
    // Step 1: Get employee's current GPS location
    const position = await requestLocationPermission();
    const employeeLat = position.coords.latitude;
    const employeeLng = position.coords.longitude;

    // Step 2: Fetch all facilities with their geofencing coordinates
    const { getSupabaseConfig, getSupabaseHeaders } = await import('./supabaseConfig');
    const { supabaseUrl } = getSupabaseConfig();
    
    const facilitiesResponse = await fetch(
      `${supabaseUrl}/rest/v1/facilities?select=id,geofence_latitude,geofence_longitude,geofence_radius_meters`,
      {
        method: 'GET',
        headers: getSupabaseHeaders()
      }
    );

    if (!facilitiesResponse.ok) {
      console.error('Failed to fetch facilities for geofencing');
      return null;
    }

    const facilities = await facilitiesResponse.json();

    // Step 3: Check if employee's location is within any facility's geofence
    for (const facility of facilities) {
      if (
        facility.geofence_latitude &&
        facility.geofence_longitude &&
        facility.geofence_radius_meters
      ) {
        const isWithinGeofence = isLocationInGeofence(
          employeeLat,
          employeeLng,
          facility.geofence_latitude,
          facility.geofence_longitude,
          facility.geofence_radius_meters
        );

        if (isWithinGeofence) {
          return facility.id;
        }
      }
    }

    // Employee is not within any facility's geofence
    console.log('📍 Employee is not within any facility geofence');
    return null;
  } catch (error) {
    console.error('Error detecting facility from geofencing:', error);
    // If location permission denied or other error, return null
    return null;
  }
};

/**
 * Check if a location (lat, lng) is within a geofence
 * 
 * @param {number} lat - Latitude of the location to check
 * @param {number} lng - Longitude of the location to check
 * @param {number} facilityLat - Latitude of the facility's geofence center
 * @param {number} facilityLng - Longitude of the facility's geofence center
 * @param {number} radiusMeters - Radius of the geofence in meters
 * @returns {boolean} True if location is within the geofence
 */
export const isLocationInGeofence = (lat, lng, facilityLat, facilityLng, radiusMeters) => {
  // Calculate distance using Haversine formula
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat - facilityLat) * Math.PI / 180;
  const dLng = (lng - facilityLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(facilityLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters
  
  return distance <= radiusMeters;
};

/**
 * Request location permission from the user
 * 
 * @returns {Promise<GeolocationPosition>} The user's current position
 */
export const requestLocationPermission = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

