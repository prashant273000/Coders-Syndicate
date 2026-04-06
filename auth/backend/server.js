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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

// =========================================
// RAG System Initialization
// =========================================
const { getRagService } = require('./services/ragService');

// Initialize RAG service (singleton)
const ragService = getRagService();

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

// Make io available to routes
app.set("io", io);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/voice", require("./routes/voice"));
app.use("/api/friends", require("./routes/friends"));
app.use("/api/match", require("./routes/match"));
app.use("/chat", require("./routes/chat"));
app.use("/api/social", require("./routes/social"));
app.use("/battle", require("./routes/battle"));
app.use("/api/leaderboard", require("./routes/leaderboard"));
app.use("/api/users", require("./routes/user"));
const { feedRoutes, initializeGridFS } = require("./routes/feed");
app.use("/api/feed", feedRoutes);

// Documentation routes (handles /api/roadmap and /api/content)
app.use("/api", require("./routes/documentation"));

// Test route (optional)
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

// Test Gemini API endpoint
app.get("/api/test-gemini", async (req, res) => {
  try {
    const ragService = getRagService();
    
    if (!ragService.geminiModel) {
      return res.json({ 
        status: 'ERROR', 
        message: 'Gemini model not initialized',
        apiKeyPresent: !!process.env.GEMINI_API_KEY
      });
    }
    
    const result = await ragService.geminiModel.generateContent('Say hello in one sentence');
    const text = result.response.text();
    
    res.json({ 
      status: 'OK', 
      reply: text,
      message: 'Gemini API is working correctly',
      apiKeyPresent: !!process.env.GEMINI_API_KEY
    });
  } catch (err) {
    res.json({ 
      status: 'ERROR', 
      error: err.message,
      apiKeyPresent: !!process.env.GEMINI_API_KEY
    });
  }
});

// =========================================
// RAG System Routes (Using Shared Service)
// =========================================

// Add documents to vector store
app.post("/api/rag/add-documents", async (req, res) => {
  try {
    const { documents, text, metadata } = req.body;
    
    if (documents) {
      const addedDocs = await ragService.addDocuments(documents);
      res.json({ success: true, addedIds: addedDocs.map(d => d.id), count: addedDocs.length });
    } else if (text) {
      const addedDocs = await ragService.addText(text, metadata || {});
      res.json({ success: true, addedIds: addedDocs.map(d => d.id), count: addedDocs.length });
    } else {
      res.status(400).json({ error: "Please provide 'documents' or 'text'" });
    }
  } catch (error) {
    console.error("Add documents error:", error);
    res.status(500).json({ error: error.message });
  }
});

// RAG-powered chat endpoint (for XSyndicate Chatbot)
app.post("/api/rag/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`💬 RAG Chat request: "${message}"`);
    
    const result = await ragService.generateChatResponse(message, conversationHistory);
    
    res.json({
      reply: result.reply,
      sources: result.sources,
      contextUsed: result.contextUsed,
      fallback: result.fallback,
      error: result.error,
    });
  } catch (error) {
    console.error("RAG chat error:", error);
    res.status(500).json({ 
      error: error.message,
      reply: "Sorry, something went wrong while processing your request."
    });
  }
});

// Documentation search endpoint (returns raw search results)
app.get("/api/docs/search", async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Query 'q' is required" });
    }

    console.log(`📚 Docs search request: "${q}"`);
    
    const results = await ragService.searchVectorStore(q, parseInt(limit));
    
    res.json({
      query: q,
      results: results.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        similarity: r.similarity,
        metadata: r.metadata,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error("Docs search error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get RAG service stats
app.get("/api/rag/stats", (req, res) => {
  const stats = ragService.getStats();
  res.json(stats);
});

// Search the vector store (for testing/debugging)
app.get("/api/rag/search", async (req, res) => {
  try {
    const { q, topK = 5 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Query 'q' is required" });
    }

    const results = await ragService.searchVectorStore(q, parseInt(topK));
    
    res.json({
      query: q,
      results: results.map(r => ({
        content: r.content,
        similarity: r.similarity,
        metadata: r.metadata,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: error.message });
  }
});
// =========================================
// RAG Service Seeding (on server start)
// =========================================
async function seedRagService() {
  try {
    // Wait a moment for MongoDB to connect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const stats = ragService.getStats();
    if (stats.totalDocuments > 0) {
      console.log('✅ RAG service already has content, skipping seed');
      return;
    }
    
    const seedContent = [
      {
        content: "JavaScript is a programming language used for web development. Key concepts include variables, functions, arrays, objects, promises, async/await, and ES6+ features.",
        metadata: { title: "JavaScript Basics", topic: "javascript" }
      },
      {
        content: "React is a JavaScript library for building user interfaces. Core concepts: components, props, state, hooks (useState, useEffect, useContext), JSX, and virtual DOM.",
        metadata: { title: "React Fundamentals", topic: "react" }
      },
      {
        content: "Data structures include arrays, linked lists, stacks, queues, trees, graphs, and hash tables. Algorithms include sorting, searching, dynamic programming, and graph traversal.",
        metadata: { title: "Data Structures", topic: "dsa" }
      },
      {
        content: "Python is a high-level programming language. Key concepts: variables, lists, dictionaries, functions, classes, modules, file I/O, and popular libraries like numpy and pandas.",
        metadata: { title: "Python Basics", topic: "python" }
      },
      {
        content: "Node.js is a JavaScript runtime built on Chrome's V8 engine. It allows running JavaScript on the server-side. Key concepts: event loop, streams, buffers, modules, Express.js framework.",
        metadata: { title: "Node.js Fundamentals", topic: "nodejs" }
      },
      {
        content: "MongoDB is a NoSQL database that stores data in flexible, JSON-like documents. Key concepts: collections, documents, indexes, aggregation pipeline, MongoDB drivers.",
        metadata: { title: "MongoDB Basics", topic: "mongodb" }
      }
    ];
    
    await ragService.addDocuments(seedContent);
    console.log('✅ RAG service seeded with initial content');
  } catch (err) {
    console.error('⚠️ RAG seeding failed:', err.message);
  }
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready for real-time chat and battles`);
  
  // Seed RAG service after server starts
  seedRagService();
});
