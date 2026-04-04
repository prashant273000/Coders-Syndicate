require('dotenv').config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const docs = {
    "opengl" : "https://learnopengl.com/"
}
console.log("GEMINI KEY EXISTS:", !!process.env.GEMINI_API_KEY);
async function generateContent(title, topic) {
  const prompt = `
You are a technical teacher.

Explain "${title}" from ${topic} in a clean, beginner-friendly, well-structured Markdown format.

Rules:
- Use proper Markdown headings like ## and ###
- Use bullet points where useful
- Add a short "What it means" section
- Add a "Why it matters" section
- Add a "Key points" bullet list
- Add an "Example" section
- If relevant, include a code block using triple backticks
- Keep it neat, readable, and visually structured
- Do not write everything in one paragraph
-leave lines between blocks or two different things
-Structured like step by step learning 


Format exactly like this:

## ${title}

### What it means
...

### Why it matters
...

### Key points
- point 1
- point 2
- point 3

### Example
\`\`\`cpp
// example here
\`\`\`

### Summary
...

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
app.use("/api/auth", require("./routes/auth"));

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});