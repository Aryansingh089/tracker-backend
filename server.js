// backend/server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SOCKET.IO
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173" },
});

// Memory session store
const sessions = new Map();

// Create session (NO PHONE REQUIRED)
app.post("/api/create-session", (req, res) => {
  const sessionId = crypto.randomBytes(16).toString("hex");

  sessions.set(sessionId, {
    allowed: false,
  });

  res.json({ sessionId });
});

// Serve allow-location page
app.get("/allow-location", (req, res) => {
  const { session } = req.query;
  if (!session || !sessions.has(session)) {
    return res.status(400).send("Invalid or expired session");
  }
  res.sendFile(path.join(__dirname, "allow-location.html"));
});

// SOCKET.IO EVENTS
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-dashboard", ({ sessionId }) => {
    socket.join(sessionId);
    console.log("Dashboard joined session:", sessionId);
  });

  socket.on("start-tracking", ({ sessionId }) => {
    const sess = sessions.get(sessionId);
    if (!sess) return;

    sess.allowed = true;
    sessions.set(sessionId, sess);
    console.log("Tracking started:", sessionId);
  });

  socket.on("location-update", ({ sessionId, lat, lng }) => {
    const sess = sessions.get(sessionId);
    if (!sess || !sess.allowed) return;

    io.to(sessionId).emit("location", { lat, lng });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
