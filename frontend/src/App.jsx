import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import MapView from "./MapView";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function App() {
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
  if (window.google && window.google.maps) {
    setMapReady(true);
  }
}, []);
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [shareLink, setShareLink] = useState("");
  const [location, setLocation] = useState(null);

  // Check Google Maps loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapReady(true);
    }
  }, []);

  // Init socket
  useEffect(() => {
    const s = io(BACKEND, { transports: ["websocket"] });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  // Listen for live location updates
  useEffect(() => {
    if (!socket || !sessionId) return;

    socket.emit("join-dashboard", { sessionId });

    socket.on("location", (loc) => {
      setLocation(loc);
    });

    return () => socket.off("location");
  }, [socket, sessionId]);

  // Create new tracking session
  const createSession = async () => {
    const res = await fetch(`${BACKEND}/api/create-session`, {
      method: "POST",
    });

    const data = await res.json();
    if (data.sessionId) {
      setSessionId(data.sessionId);

      // Generate sharable link
      const localIP = BACKEND.replace("http://", "");
      const link = `http://${localIP}/allow-location?session=${data.sessionId}`;
      setShareLink(link);
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Real-Time Tracker Dashboard</h1>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={createSession}
      >
        Create Tracking Session
      </button>

      {sessionId && (
        <p className="mt-3 text-gray-700">
          <strong>Session ID:</strong> {sessionId}
        </p>
      )}

      {shareLink && (
        <div className="mt-4">
          <p className="font-semibold">Send this link to the user:</p>
          <input
            type="text"
            value={shareLink}
            readOnly
            className="border p-2 w-full mt-2"
          />
        </div>
      )}

      <div className="mt-6" style={{ height: "70vh" }}>
        {mapReady && <MapView location={location} />}
      </div>
    </div>
  );
}
