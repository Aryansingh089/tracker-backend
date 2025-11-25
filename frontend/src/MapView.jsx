import React, { useEffect, useRef } from "react";

export default function MapView({ location }) {
  const mapRef = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  // Load map only ONCE
  useEffect(() => {
    if (!window.google || !window.google.maps) return;

    map.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 }, // India center
      zoom: 5,
      gestureHandling: "greedy",
    });
  }, []);

  // Update marker only when location changes
  useEffect(() => {
    if (!location || !map.current) return;

    const pos = { lat: location.lat, lng: location.lng };

    // If marker doesn't exist → create it
    if (!marker.current) {
      marker.current = new window.google.maps.Marker({
        map: map.current,
        position: pos,
        animation: window.google.maps.Animation.DROP,
      });
    } else {
      marker.current.setPosition(pos);
    }

    // Smooth move + zoom
    map.current.panTo(pos);
    map.current.setZoom(16);

  }, [location]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", borderRadius: "10px" }}
    />
  );
}
