const { v4: uuidv4 } = require("uuid");
const BattleRoom = require("../models/BattleRoom");
const User = require("../models/user");
const { questions } = require("../data/questions");

// Matchmaking queue: [{ userId, username, photoURL, socketId }]
let matchmakingQueue = [];

// Active timers for each room: { roomId: timerInterval }
const activeTimers = new Map();

// Track player scores (solved count) per room
const roomScores = new Map(); // { roomId: { player1Solved: 0, player2Solved: 0 } }

module.exports = function attachBattleSocket(io) {
  io.on("connection", (socket) => {
    console.log(`⚡ Battle socket connected: ${socket.id}`);

    // Join matchmaking queue
    socket.on("joinQueue", (data) => {
      try {
        const { userId, username, photoURL } = data;
        if (!userId || !username) {
          socket.emit("error", { message: "Invalid user data" });
          return;
        }

        // Check if already in queue
        const existingIndex = matchmakingQueue.findIndex((u) => u.userId === userId);
        if (existingIndex !== -1) {
          console.log(`User ${userId} already in queue, updating socket`);
          matchmakingQueue[existingIndex].socketId = socket.id;
          return;
        }

        // Add to queue
        const userInfo = { userId, username, photoURL: photoURL || "", socketId: socket.id };
        matchmakingQueue.push(userInfo);
        socket.data.userId = userId;
        socket.data.inQueue = true;

        console.log(`🎯 ${username} joined matchmaking queue. Queue size: ${matchmakingQueue.length}`);

        // If 2+ users in queue, create a match
        if (matchmakingQueue.length >= 2) {
          const player1 = matchmakingQueue.shift();
          const player2 = matchmakingQueue.shift();

          // Generate room and select random question
          const roomId = uuidv4();
          const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

          console.log(`🔥 Match created: ${player1.username} vs ${player2.username} in room ${roomId}`);
          console.log(`📝 Question: ${randomQuestion.title} (${randomQuestion.difficulty})`);

          const matchData = {
            roomId,
            question: {
              title: randomQuestion.title,
              description: randomQuestion.description,
              difficulty: randomQuestion.difficulty,
              examples: randomQuestion.examples,
              testCases: randomQuestion.testCases,
            },
          };

          // Send match found to player1
          io.to(player1.socketId).emit("matchFound", {
            ...matchData,
            opponent: {
              userId: player2.userId,
              username: player2.username,
              photoURL: player2.photoURL,
            },
            isPlayer1: true,
          });

          // Send match found to player2
          io.to(player2.socketId).emit("matchFound", {
            ...matchData,
            opponent: {
              userId: player1.userId,
              username: player1.username,
              photoURL: player1.photoURL,
            },
            isPlayer1: false,
          });

          // Store match data temporarily for when players join room
          socket.data.pendingRoom = {
            roomId,
            player1: { userId: player1.userId, username: player1.username, photoURL: player1.photoURL },
            player2: { userId: player2.userId, username: player2.username, photoURL: player2.photoURL },
            question: randomQuestion,
          };

          // Create battle room in database
          const battleRoom = new BattleRoom({
            roomId,
            player1: { userId: player1.userId, username: player1.username, photoURL: player1.photoURL },
            player2: { userId: player2.userId, username: player2.username, photoURL: player2.photoURL },
            question: {
              title: randomQuestion.title,
              description: randomQuestion.description,
              difficulty: randomQuestion.difficulty,
              examples: randomQuestion.examples,
              testCases: randomQuestion.testCases,
            },
          });

          battleRoom.save().catch((err) => console.error("Failed to save battle room:", err));
        }
      } catch (error) {
        console.error("joinQueue error:", error);
        socket.emit("error", { message: "Failed to join queue" });
      }
    });

    // Leave matchmaking queue
    socket.on("leaveQueue", () => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        matchmakingQueue = matchmakingQueue.filter((u) => u.userId !== userId);
        socket.data.inQueue = false;

        console.log(`🚫 ${userId} left matchmaking queue. Queue size: ${matchmakingQueue.length}`);
      } catch (error) {
        console.error("leaveQueue error:", error);
      }
    });

    // Join battle room
    socket.on("joinRoom", (data) => {
      try {
        const { roomId, userId } = data;
        if (!roomId || !userId) return;

        socket.join(roomId);
        socket.data.currentRoom = roomId;

        console.log(`🏠 ${userId} joined room ${roomId}`);

        // Initialize room scores if not exists
        if (!roomScores.has(roomId)) {
          roomScores.set(roomId, { player1Solved: 0, player2Solved: 0 });
        }

        // Notify opponent that player joined
        socket.to(roomId).emit("opponentJoined", { userId });

        // Send current room state
        BattleRoom.findOne({ roomId }).then((room) => {
          if (room) {
            socket.emit("roomState", {
              submissions: room.submissions,
              status: room.status,
              scores: roomScores.get(roomId),
            });

            // Start timer if both players are in the room
            const playersInRoom = io.sockets.adapter.rooms.get(roomId);
            if (playersInRoom && playersInRoom.size === 2 && !activeTimers.has(roomId)) {
              startBattleTimer(io, roomId, room);
            }
          }
        });
      } catch (error) {
        console.error("joinRoom error:", error);
      }
    });

    // Code update (for live sync indicator)
    socket.on("codeUpdate", (data) => {
      try {
        const { roomId, userId, isTyping } = data;
        if (!roomId) return;

        socket.to(roomId).emit("opponentTyping", { userId, isTyping });
      } catch (error) {
        console.error("codeUpdate error:", error);
      }
    });

    // Handle submission result from battle route
    socket.on("submitResult", async (data) => {
      try {
        const { roomId, userId, code, language, languageId, verdict, score, testResults } = data;

        // Save submission to database
        const room = await BattleRoom.findOne({ roomId });
        if (!room || room.status !== "ongoing") return;

        room.submissions.push({
          userId,
          code,
          language,
          languageId,
          verdict,
          score,
          testResults,
        });

        // Update player's solved count if all tests passed
        const allTestsPassed = testResults && testResults.every(t => t.passed);
        const scores = roomScores.get(roomId);
        
        if (allTestsPassed && scores) {
          if (userId === room.player1.userId) {
            scores.player1Solved = (scores.player1Solved || 0) + 1;
          } else if (userId === room.player2.userId) {
            scores.player2Solved = (scores.player2Solved || 0) + 1;
          }
          roomScores.set(roomId, scores);
        }

        // Check if both players have submitted
        const player1Submissions = room.submissions.filter((s) => s.userId === room.player1.userId);
        const player2Submissions = room.submissions.filter((s) => s.userId === room.player2.userId);

        const player1BestScore = player1Submissions.length > 0 ? Math.max(...player1Submissions.map((s) => s.score)) : 0;
        const player2BestScore = player2Submissions.length > 0 ? Math.max(...player2Submissions.map((s) => s.score)) : 0;

        // Broadcast submission to room
        io.to(roomId).emit("submissionUpdate", {
          userId,
          verdict,
          score,
          testResults,
          player1BestScore,
          player2BestScore,
          player1Name: room.player1.username,
          player2Name: room.player2.username,
          scores: scores,
        });

        // If both have submitted at least once, determine winner
        if (player1Submissions.length > 0 && player2Submissions.length > 0) {
          const winnerId = player1BestScore > player2BestScore ? room.player1.userId : 
                          player2BestScore > player1BestScore ? room.player2.userId : null;

          room.status = "finished";
          room.endedAt = new Date();

          if (winnerId) {
            room.winnerId = winnerId;
            room.winnerScore = Math.max(player1BestScore, player2BestScore);
            room.loserScore = Math.min(player1BestScore, player2BestScore);
          } else {
            // Draw
            room.winnerId = "draw";
            room.winnerScore = player1BestScore;
            room.loserScore = player2BestScore;
          }

          await room.save();

          // Update user stats
          await updateUserStatsAfterBattle(room);

          // Broadcast battle over
          io.to(roomId).emit("battleOver", {
            winnerId,
            winnerScore: room.winnerScore,
            loserScore: room.loserScore,
            isDraw: winnerId === null,
            player1Name: room.player1.username,
            player2Name: room.player2.username,
            reason: "both_submitted",
          });

          // Clean up timer
          if (activeTimers.has(roomId)) {
            clearInterval(activeTimers.get(roomId));
            activeTimers.delete(roomId);
          }

          console.log(`🏆 Battle ${roomId} finished! Winner: ${winnerId || "Draw"}`);
        }

        await room.save();
      } catch (error) {
        console.error("submitResult error:", error);
      }
    });

    // Player quit - opponent wins immediately
    socket.on("playerQuit", async (data) => {
      try {
        const { roomId, userId, reason } = data;
        if (!roomId || !userId) return;

        console.log(`🏳️ Player ${userId} quit room ${roomId}`);

        const room = await BattleRoom.findOne({ roomId });
        if (!room || room.status !== "ongoing") return;

        // Determine winner (the other player)
        const quitterId = userId;
        const winnerId = room.player1.userId === quitterId ? room.player2.userId : room.player1.userId;

        room.status = "finished";
        room.endedAt = new Date();
        room.winnerId = winnerId;

        // Get current scores
        const scores = roomScores.get(roomId) || { player1Solved: 0, player2Solved: 0 };
        room.winnerScore = winnerId === room.player1.userId ? scores.player1Solved : scores.player2Solved;
        room.loserScore = winnerId === room.player1.userId ? scores.player2Solved : scores.player1Solved;

        await room.save();

        // Update user stats
        await updateUserStatsAfterBattle(room, winnerId, quitterId);

        // Clean up timer
        if (activeTimers.has(roomId)) {
          clearInterval(activeTimers.get(roomId));
          activeTimers.delete(roomId);
        }

        // Broadcast battle over to both players
        io.to(roomId).emit("battleOver", {
          winnerId,
          loserId: quitterId,
          winnerScore: room.winnerScore,
          loserScore: room.loserScore,
          isDraw: false,
          player1Name: room.player1.username,
          player2Name: room.player2.username,
          reason: "opponent_quit",
          quitReason: reason || "surrendered",
        });

        console.log(`🏆 Battle ${roomId} finished! ${winnerId} wins because ${quitterId} quit.`);
      } catch (error) {
        console.error("playerQuit error:", error);
      }
    });

    // Timer ended - compare scores
    socket.on("timerEnded", async (data) => {
      try {
        const { roomId } = data;
        if (!roomId) return;

        console.log(`⏰ Timer ended for room ${roomId}`);

        const room = await BattleRoom.findOne({ roomId });
        if (!room || room.status !== "ongoing") return;

        // Get final scores
        const scores = roomScores.get(roomId) || { player1Solved: 0, player2Solved: 0 };
        
        room.status = "finished";
        room.endedAt = new Date();

        let winnerId;
        if (scores.player1Solved > scores.player2Solved) {
          winnerId = room.player1.userId;
          room.winnerId = winnerId;
          room.winnerScore = scores.player1Solved;
          room.loserScore = scores.player2Solved;
        } else if (scores.player2Solved > scores.player1Solved) {
          winnerId = room.player2.userId;
          room.winnerId = winnerId;
          room.winnerScore = scores.player2Solved;
          room.loserScore = scores.player1Solved;
        } else {
          // Draw
          winnerId = "draw";
          room.winnerId = "draw";
          room.winnerScore = scores.player1Solved;
          room.loserScore = scores.player2Solved;
        }

        await room.save();

        // Update user stats
        await updateUserStatsAfterBattle(room, winnerId === "draw" ? null : winnerId, null);

        // Clean up timer
        if (activeTimers.has(roomId)) {
          clearInterval(activeTimers.get(roomId));
          activeTimers.delete(roomId);
        }

        // Broadcast battle over
        io.to(roomId).emit("battleOver", {
          winnerId: winnerId === "draw" ? null : winnerId,
          winnerScore: room.winnerScore,
          loserScore: room.loserScore,
          isDraw: winnerId === "draw",
          player1Name: room.player1.username,
          player2Name: room.player2.username,
          reason: "time_expired",
          finalScores: scores,
        });

        console.log(`🏆 Battle ${roomId} finished! Winner: ${winnerId === "draw" ? "Draw" : winnerId}`);
      } catch (error) {
        console.error("timerEnded error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      try {
        const userId = socket.data.userId;
        const currentRoom = socket.data.currentRoom;

        // Remove from matchmaking queue
        if (socket.data.inQueue) {
          matchmakingQueue = matchmakingQueue.filter((u) => u.userId !== userId);
        }

        // If in a battle, treat disconnect as quit
        if (currentRoom) {
          // Emit playerQuit event to handle disconnect as surrender
          socket.emit("playerQuit", { roomId: currentRoom, userId, reason: "disconnected" });
          
          // Also notify the room
          socket.to(currentRoom).emit("opponentDisconnected", { userId });
        }

        console.log(`🔌 Socket disconnected: ${socket.id}, userId: ${userId}`);
      } catch (error) {
        console.error("disconnect error:", error);
      }
    });
  });
};

// Start battle timer (15 minutes)
function startBattleTimer(io, roomId, room) {
  const BATTLE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
  const TICK_INTERVAL = 1000; // Update every second

  const startTime = Date.now();
  const endTime = startTime + BATTLE_DURATION;

  // Send initial time
  io.to(roomId).emit("timerUpdate", {
    roomId,
    timeRemaining: BATTLE_DURATION,
    startTime,
    endTime,
  });

  const timerInterval = setInterval(() => {
    const now = Date.now();
    const timeRemaining = Math.max(0, endTime - now);

    // Broadcast time update
    io.to(roomId).emit("timerUpdate", {
      roomId,
      timeRemaining,
      startTime,
      endTime,
    });

    if (timeRemaining <= 0) {
      // Timer ended - trigger score comparison
      io.emit("timerEnded", { roomId });
      clearInterval(timerInterval);
      activeTimers.delete(roomId);
    }
  }, TICK_INTERVAL);

  activeTimers.set(roomId, timerInterval);
  console.log(`⏱️ Timer started for room ${roomId}`);
}

// Update user stats after battle
async function updateUserStatsAfterBattle(room, winnerId, loserId) {
  try {
    const xpWin = 100;
    const xpLoss = 25;

    if (winnerId) {
      // Update winner
      await User.findOneAndUpdate(
        { uid: winnerId },
        {
          $inc: { xpEarned: xpWin, battlesWon: 1 },
          $set: { tier: calculateTier(room.player1.userId === winnerId ? room.winnerScore : room.winnerScore) }
        }
      );

      // Update loser
      if (loserId) {
        await User.findOneAndUpdate(
          { uid: loserId },
          {
            $inc: { xpEarned: xpLoss, battlesLost: 1 },
          }
        );
      }
    } else {
      // Draw - both get moderate XP
      await User.findOneAndUpdate(
        { uid: room.player1.userId },
        { $inc: { xpEarned: 50 } }
      );
      await User.findOneAndUpdate(
        { uid: room.player2.userId },
        { $inc: { xpEarned: 50 } }
      );
    }
  } catch (error) {
    console.error("updateUserStatsAfterBattle error:", error);
  }
}

// Calculate tier based on wins (simplified)
function calculateTier(wins) {
  if (wins >= 50) return "Apex Tier";
  if (wins >= 30) return "Diamond Tier";
  if (wins >= 20) return "Platinum Tier";
  if (wins >= 10) return "Gold Tier";
  if (wins >= 5) return "Silver Tier";
  return "Bronze Tier";
}