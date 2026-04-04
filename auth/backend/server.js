require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");

const app = express();

const server = http.createServer(app); // wrap express with http server
 
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

console.log("MONGO_URI", process.env.MONGO_URI)
const connectDB = require("./config/db");
connectDB();

// Firebase Admin Setup
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth")); //Auth Route
app.use("/api/match", require("./routes/matchRoutes")); //Match Route
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/judge", require("./routes/judgeRoutes"));
app.use("/api/user", require("./routes/userRoutes"));

const userSockets = {}; // { uid: socketId }
const matchRooms = {};  // { matchId: [uid1, uid2] }
 
io.on("connection", (socket) => {
  console.log("🔌 New socket connected:", socket.id);
 
  // Player joins their match room
  socket.on("join_match", ({ matchId, uid, displayName, photoURL }) => {
    socket.join(matchId);
    userSockets[uid] = socket.id;
 
    if (!matchRooms[matchId]) matchRooms[matchId] = [];
    matchRooms[matchId].push({ uid, displayName, photoURL });
 
    console.log(`👤 ${displayName} joined match ${matchId}`);
 
    // Tell everyone in the room who has joined
    io.to(matchId).emit("player_joined", {
      players: matchRooms[matchId],
    });
  });
 
  // Player updates their code — broadcast to opponent
  socket.on("code_update", ({ matchId, uid, code }) => {
    socket.to(matchId).emit("opponent_code_update", { code });
  });
 
  // Player solved a problem
  socket.on("problem_solved", ({ matchId, uid, solvedCount }) => {
    socket.to(matchId).emit("opponent_solved", { solvedCount });
  });
 
  // Player ends the match
  socket.on("end_match", ({ matchId, winnerId }) => {
    io.to(matchId).emit("match_ended", { winnerId });
    delete matchRooms[matchId];
  });
 
  // Player disconnects
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    // Find which user disconnected
    for (let uid in userSockets) {
      if (userSockets[uid] === socket.id) {
        delete userSockets[uid];
        // Notify their match room
        for (let matchId in matchRooms) {
          const room = matchRooms[matchId];
          if (room.find(p => p.uid === uid)) {
            socket.to(matchId).emit("opponent_disconnected");
          }
        }
        break;
      }
    }
  });
});

// Test route (optional)
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});