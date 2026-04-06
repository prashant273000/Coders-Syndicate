const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const { getRagService } = require("../services/ragService");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/voice/text — Text chat with XSyndicate
 * Uses RAG service for context-aware responses
 */
router.post("/text", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    console.log('💬 XSyndicate text chat request:', message?.substring(0, 50));

    if (!message || !message.trim()) {
      return res.json({ reply: "Please send a message!" });
    }

    const ragService = getRagService();

    // Check if RAG service is initialized
    if (!ragService.geminiModel) {
      console.error('❌ Gemini model not initialized');
      return res.json({ 
        reply: "I'm still initializing. Please check that GEMINI_API_KEY is set correctly in your .env file and restart the server.",
        error: "Model not initialized"
      });
    }

    // Use RAG service to generate response with context
    const result = await ragService.generateChatResponse(message, history);

    console.log('✅ XSyndicate response generated, contextUsed:', result.contextUsed);

    res.json({ 
      reply: result.reply,
      sources: result.sources || [],
      contextUsed: result.contextUsed || false,
      fallback: result.fallback || false
    });

  } catch (err) {
    console.error('❌ Voice text route error:', err.message);
    res.json({ 
      reply: "I encountered an error processing your request. Please try again.",
      error: err.message
    });
  }
});

/**
 * POST /api/voice/ask — Voice input with ElevenLabs transcription
 */
router.post("/ask", upload.single("audio"), async (req, res) => {
  try {
    console.log('🎙️ Voice ask request received');

    if (!req.file) {
      return res.json({
        transcript: "",
        reply: "No audio file received. Please try again."
      });
    }

    const ragService = getRagService();

    if (!ragService.geminiModel) {
      return res.json({
        transcript: "",
        reply: "Voice service not initialized. Check GEMINI_API_KEY."
      });
    }

    // Transcribe audio using ElevenLabs
    let transcript = "";
    try {
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

      transcript = transcriptResponse?.data?.text || "";
      console.log('🎤 Transcribed:', transcript?.substring(0, 50));
    } catch (transcribeErr) {
      console.error('⚠️ Transcription failed:', transcribeErr.message);
      transcript = "Voice message received (transcription unavailable)";
    }

    // Generate response using RAG service
    const result = await ragService.generateChatResponse(transcript, []);

    res.json({
      transcript: transcript,
      reply: result.reply,
      sources: result.sources || [],
      contextUsed: result.contextUsed || false
    });

  } catch (err) {
    console.error('❌ Voice ask route error:', err.message);
    res.json({
      transcript: "",
      reply: "Voice processing encountered an error. Please type your message instead.",
      error: err.message
    });
  }
});

module.exports = router;