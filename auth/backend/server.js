require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const docs = {
    "opengl" : "https://learnopengl.com/"
}
console.log("GEMINI KEY EXISTS:", !!process.env.GEMINI_API_KEY);
async function generateContent(title, topic) {
  const prompt = `
Act as an expert technical teacher creating clean, highly structured coding documentation.

Explain "${title}" in the context of ${topic} in a beginner-friendly way.

You MUST strictly follow the exact Markdown formatting, spacing, and styling shown below.

Formatting Rules:
- Use a book emoji 📘 and bold text for the main title.
- Use a blue diamond 🔹 and numbers for section headings (use bold text, NOT markdown headers).
- Use horizontal rules (---) to separate sections.
- Use bold text for key terms in the introduction.
- Use bullet points using * symbol.
- Use inline code formatting with backticks and → for explanations.
- Always include a properly formatted code block with syntax highlighting.
- Keep spacing clean and readable.
- Do NOT add extra sections outside this format.

STRICT TEMPLATE TO FOLLOW:

*📘 ${title} (Quick Guide) *

🔹 1. What is ${title}? **
[1-2 short sentences explaining what it is. Bold the most important keywords.]
It supports/features:
* [Feature 1]
* [Feature 2]
* [Feature 3]**

---

*🔹 2. Basic Structure of ${title} *

\`\`\`cpp
// Write clean, simple, beginner-friendly example code related to ${title}
\`\`\`

Explanation:
* \`code part\` → explanation
* \`code part\` → explanation
* \`code part\` → explanation
* \`code part\` → explanation

---

*🔹 3. Key Points of ${title} *
* Important concept 1
* Important concept 2
* Important concept 3
* Common mistake or tip

Make sure the explanation is clear, beginner-friendly, and visually structured.
`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text returned from Gemini");
  }

  return text;
}
async function crawl(input) {
    try {
        const res = await axios.get(docs[input]);
        const $ = cheerio.load(res.data);

        let topics = [];

        $("ol > li").each((i, el) => {

            // Try to get main label (span)
            let text = $(el).children("span").text().trim();

            // If no span (like Introduction), fallback
            if (!text) {
                text = $(el)
                    .clone()
                    .children("ol") // remove nested list
                    .remove()
                    .end()
                    .text()
                    .trim();
            }

            if (text) {
                topics.push(text);
            }
        });

        //console.log(topics);
        //return topics;
        return topics.map((title, index) => ({
          id: index + 1,
          title: title,
          status: index === 0 ? "active" : "locked",
          icon: "📘",
          content: `Content for ${title} in ${input}`
        }));

    } catch (err) {
        console.error(err);
    }
}
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
app.use("/api/versus", require("./routes/matchRoutes")); //Match Route
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/judge", require("./routes/judgeRoutes"));
app.use("/api/voice",       require("./routes/voice"));
app.use("/api/friends",     require("./routes/friends"));
app.use("/api/match",       require("./routes/match"));       // friendly match (Branch 1)
app.use("/api/leaderboard", require("./routes/leaderboard"));

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

const onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("register", (uid) => {
    onlineUsers[uid] = socket.id;
  });

  socket.on("disconnect", () => {
    for (const uid in onlineUsers) {
      if (onlineUsers[uid] === socket.id) {
        delete onlineUsers[uid];
      }
    }
  });
});

module.exports = { io, onlineUsers };

// Test route (optional)
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});
app.post("/api/roadmap",async (req, res) => {
   try{
      const { topic } = req.body;
      const roadmap = await crawl(topic);
      res.json(roadmap);

   }catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }

});
app.post("/api/content", async (req, res) => {
  try {
    const { title, topic } = req.body;

    console.log("TITLE:", title);
    console.log("TOPIC:", topic);

    const content = await generateContent(title, topic);

    res.json({ content });
  } catch (error) {
    console.error("CONTENT API ERROR:");
    console.error(error.response?.data || error.message || error);

    res.status(500).json({
      error: "Failed to generate content",
      details: error.response?.data || error.message,
    });
  }
});
// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});