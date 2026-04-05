require('dotenv').config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const http = require("http");
const { Server } = require("socket.io");
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
const server = http.createServer(app);

// Socket.IO Setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || '*', 'http://localhost:5173', 'http://localhost:3000']
      : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
});

// Attach Socket handlers
const attachChatSocket = require("./socket/chatSocket");
const attachBattleSocket = require("./socket/battleSocket");

attachChatSocket(io);
attachBattleSocket(io);

console.log("MONGO_URI", process.env.MONGO_URI)
const connectDB = require("./config/db");
connectDB();

// Firebase Admin Setup
// Support both environment variable and local file for Firebase credentials
let firebaseConfig;
if (process.env.FIREBASE_CREDENTIALS) {
  // Parse from environment variable (for production like Render)
  // Handle newlines in private key - try multiple approaches
  let credentialsStr = process.env.FIREBASE_CREDENTIALS;
  try {
    // First try parsing directly
    firebaseConfig = JSON.parse(credentialsStr);
  } catch (e) {
    try {
      // Replace escaped newlines with actual newlines
      firebaseConfig = JSON.parse(credentialsStr.replace(/\\n/g, '\n'));
    } catch (e2) {
      try {
        // Remove all newlines and try again (for multi-line env vars)
        firebaseConfig = JSON.parse(credentialsStr.replace(/\n/g, '\\n').replace(/\\n/g, '\n'));
      } catch (e3) {
        console.error('Failed to parse FIREBASE_CREDENTIALS:', e3.message);
        throw new Error('Invalid FIREBASE_CREDENTIALS environment variable. Ensure it is valid JSON.');
      }
    }
  }
} else {
  // Load from local file (for development)
  firebaseConfig = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

// Middleware - CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || '*', 'http://localhost:5173', 'http://localhost:3000']
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/voice", require("./routes/voice"));
app.use("/api/friends", require("./routes/friends"));
app.use("/api/match", require("./routes/match"));
app.use("/chat", require("./routes/chat"));
app.use("/api/social", require("./routes/social"));
app.use("/battle", require("./routes/battle"));
const { feedRoutes, initializeGridFS } = require("./routes/feed");
app.use("/api/feed", feedRoutes);
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
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready for real-time chat and battles`);
});
