import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

// styles
import useStyles from "./styles";

const mapContainerStyle = {
  width: "100%",
  height: "400px"
};

const center = {
  lat: -37.813179,
  lng: 144.950259
};

export default function Maps() {
  var classes = useStyles();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"
  });

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className={classes.mapContainer}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
}
