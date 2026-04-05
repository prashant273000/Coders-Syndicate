const { v4: uuidv4 } = require("uuid");
const BattleRoom = require("../models/BattleRoom");
const { questions } = require("../data/questions");

// Matchmaking queue: [{ userId, username, photoURL, socketId }]
let matchmakingQueue = [];

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

        // Notify opponent that player joined
        socket.to(roomId).emit("opponentJoined", { userId });

        // Send current room state
        BattleRoom.findOne({ roomId }).then((room) => {
          if (room) {
            socket.emit("roomState", {
              submissions: room.submissions,
              status: room.status,
            });
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

          // Broadcast battle over
          io.to(roomId).emit("battleOver", {
            winnerId,
            winnerScore: room.winnerScore,
            loserScore: room.loserScore,
            isDraw: winnerId === null,
            player1Name: room.player1.username,
            player2Name: room.player2.username,
          });

          console.log(`🏆 Battle ${roomId} finished! Winner: ${winnerId || "Draw"}`);
        }

        await room.save();
      } catch (error) {
        console.error("submitResult error:", error);
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

        // Notify room if in a battle
        if (currentRoom) {
          socket.to(currentRoom).emit("opponentDisconnected", { userId });
        }

        console.log(`🔌 Socket disconnected: ${socket.id}, userId: ${userId}`);
      } catch (error) {
        console.error("disconnect error:", error);
      }
    });
  });
};