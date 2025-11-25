/**
 * Geocoding utility to convert addresses to coordinates
 * Uses Google Geocoding API (if API key available) or falls back to OpenStreetMap Nominatim
 */

/**
 * Geocode an address using Google Geocoding API
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number, displayName?: string} | null>} Coordinates or null if not found
 */
const geocodeWithGoogle = async (address) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return null; // Fall back to OpenStreetMap
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        displayName: result.formatted_address
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding with Google:', error);
    return null; // Fall back to OpenStreetMap
  }
};

/**
 * Geocode an address to get latitude and longitude coordinates
 * Tries Google Geocoding API first, falls back to OpenStreetMap Nominatim
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number, displayName?: string} | null>} Coordinates or null if not found
 */
export const geocodeAddress = async (address) => {
  if (!address || !address.trim()) {
    return null;
  }

  // Try Google Geocoding API first (more accurate, uses API key)
  const googleResult = await geocodeWithGoogle(address);
  if (googleResult) {
    return googleResult;
  }

  // Fall back to OpenStreetMap Nominatim (free, no API key required)
  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'PlumingEagleManagement/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
};

/**
 * Reverse geocode coordinates to get an address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string | null>} Address or null if not found
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'PlumingEagleManagement/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.display_name) {
      return data.display_name;
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

