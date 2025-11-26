import React, { useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

function GeofencingMap({ latitude, longitude, radius = 100, onLocationChange }) {
  // Suppress Google Maps Marker deprecation warning
  // This is a known issue with @react-google-maps/api library
  // The library hasn't been updated to use AdvancedMarkerElement yet
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('google.maps.Marker is deprecated')) {
        // Suppress this specific deprecation warning
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.warn = originalWarn;
    };
  }, []);
  const center = useMemo(() => ({
    lat: latitude || 0,
    lng: longitude || 0
  }), [latitude, longitude]);

  // Calculate appropriate zoom level based on radius
  // Larger radius = lower zoom (zoom out more)
  const calculateZoom = (radiusMeters) => {
    if (radiusMeters <= 50) return 17;
    if (radiusMeters <= 100) return 16;
    if (radiusMeters <= 200) return 15;
    if (radiusMeters <= 500) return 14;
    if (radiusMeters <= 1000) return 13;
    return 12;
  };

  const zoom = useMemo(() => calculateZoom(radius), [radius]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = React.useState(null);
  const [markerPosition, setMarkerPosition] = React.useState(center);

  // Update marker position when coordinates change
  React.useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onMarkerDragEnd = useCallback((event) => {
    const newPosition = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    setMarkerPosition(newPosition);
    if (onLocationChange) {
      onLocationChange(newPosition.lat, newPosition.lng);
    }
  }, [onLocationChange]);

  if (loadError) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Google Maps failed to load. Please check your API key configuration.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          To enable map visualization, add <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          You can still set geofencing coordinates - the map is optional for verification.
        </Typography>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading map...
        </Typography>
      </Box>
    );
  }

  if (!latitude || !longitude) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Set geofencing coordinates to view the location on the map.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        {onLocationChange ? 'Drag the marker to adjust the location if needed' : 'Geofencing location on map'}
      </Typography>
      <Box sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true
          }}
        >
          <Marker
            position={markerPosition}
            draggable={!!onLocationChange}
            onDragEnd={onMarkerDragEnd}
            title="Facility Location"
          />
          <Circle
            center={markerPosition}
            radius={radius}
            options={{
              fillColor: '#4285F4',
              fillOpacity: 0.2,
              strokeColor: '#4285F4',
              strokeOpacity: 0.8,
              strokeWeight: 2
            }}
          />
        </GoogleMap>
      </Box>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Blue circle shows the geofence radius ({radius}m). Employees within this area will be detected at this facility.
      </Typography>
    </Box>
  );
}

export default GeofencingMap;
