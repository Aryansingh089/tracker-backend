require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "*";

// CORS
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// In-memory session store
const sessions = new Map();

// Create session
app.post("/api/create-session", (req, res) => {
  const sessionId = crypto.randomBytes(16).toString("hex");
  sessions.set(sessionId, { allowed: false });
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

// PORT LISTENER
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
