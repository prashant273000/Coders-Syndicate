const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function generateChatReply(userMessage) {
  const prompt = `
You are a helpful chatbot inside a documentation-learning website.

Rules:
- Reply in simple, beginner-friendly language
- Keep the answer short to medium length
- If the question is technical, explain step by step
- Do not use Markdown headings
- Sound natural and helpful

User message: "${userMessage}"
`;

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash"
  ];

  let lastError;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
      } catch (error) {
        lastError = error;

        const status = error?.response?.status;

        // Retry only for temporary overload/server issues
        if (status === 503 || status === 429 || status >= 500) {
          const delay = attempt * 1500;
          console.log(`Gemini retry ${attempt} for model ${model} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
  }

  throw lastError;
}

router.post("/ask", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    const form = new FormData();
    form.append("model_id", "scribe_v2");
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "recording.webm",
      contentType: req.file.mimetype,
    });

    const transcriptResponse = await axios.post(
      "https://api.elevenlabs.io/v1/speech-to-text",
      form,
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          ...form.getHeaders(),
        },
      }
    );

    const transcript = transcriptResponse?.data?.text;

    if (!transcript) {
      return res.status(500).json({ error: "No transcript returned from ElevenLabs" });
    }

    const reply = await generateChatReply(transcript);

    res.json({
      transcript,
      reply,
    });
  } catch (error) {
    console.error("VOICE ASK ERROR:");
    console.error(error.response?.data || error.message || error);

    res.status(500).json({
      error: "Failed to process voice input",
      details: error.response?.data || error.message,
    });
  }
});

router.post("/text", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await generateChatReply(message);

    res.json({ reply });
  } catch (error) {
    console.error("TEXT CHAT ERROR:");
    console.error(error.response?.data || error.message || error);

    const status = error?.response?.status;

if (status === 503) {
  return res.status(503).json({
    error: "AI service is busy right now. Please try again in a few seconds.",
  });
    }

    res.status(500).json({
    error: "Failed to process text message",
    details: error.response?.data || error.message,
    });
  }
});

module.exports = router;