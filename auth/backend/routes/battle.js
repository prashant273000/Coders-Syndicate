const express = require("express");
const router = express.Router();
const axios = require("axios");
const { questions, languageIds, languageNames } = require("../data/questions");
const BattleRoom = require("../models/BattleRoom");

// JDoodle API configuration
const JDOODLE_API_URL = "https://api.jdoodle.com/v1/execute";
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;

console.log("🔑 JDoodle API configured:", JDOODLE_CLIENT_ID ? "Yes" : "No - Please add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to .env");

// Language mapping for JDoodle API
const getJDoodleLanguage = (language) => {
  const mapping = {
    "javascript": { language: "nodejs", versionIndex: "4" },
    "python": { language: "python3", versionIndex: "3" },
    "cpp": { language: "cpp17", versionIndex: "0" },
    "java": { language: "java", versionIndex: "4" },
    "c": { language: "c", versionIndex: "5" },
  };
  return mapping[language.toLowerCase()] || mapping["javascript"];
};

// Execute code via JDoodle API
const executeCode = async (code, language, stdin = "") => {
  if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
    throw new Error("JDoodle API credentials not configured. Please add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your .env file.");
  }

  const jdoodleConfig = getJDoodleLanguage(language);
  
  console.log("📤 Sending to JDoodle:", { 
    language: jdoodleConfig.language,
    version: jdoodleConfig.versionIndex,
    hasStdin: !!stdin, 
    codeLength: code.length 
  });

  try {
    const response = await axios.post(
      JDOODLE_API_URL,
      {
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
        script: code,
        language: jdoodleConfig.language,
        versionIndex: jdoodleConfig.versionIndex,
        stdin: stdin,
      },
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("❌ JDoodle API Error:", error.response.status, error.response.data);
      throw new Error(`JDoodle API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error("❌ No response from JDoodle:", error.message);
      throw new Error("No response from JDoodle API. Please check your network connection.");
    } else {
      console.error("❌ Request error:", error.message);
      throw new Error(`Request error: ${error.message}`);
    }
  }
};

// Run code against JDoodle (for custom input testing)
router.post("/run", async (req, res) => {
  try {
    const { code, language, versionIndex, stdin } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    const result = await executeCode(code, language, stdin || "");
    
    const output = result.output || "";
    const statusCode = result.statusCode || "0";
    const memory = result.memory || "0";
    const cpuTime = result.cpuTime || "0";
    const error = result.error || "";

    console.log(`📥 JDoodle response: statusCode=${statusCode}`);

    res.json({
      output,
      error,
      statusCode,
      memory,
      cpuTime,
      status: statusCode === "0" ? "Accepted" : `Exit Code: ${statusCode}`,
    });
  } catch (error) {
    console.error("❌ JDoodle run error:", error.message);
    res.status(500).json({
      error: "Failed to execute code",
      details: error.message,
      hint: "Make sure you have set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in your .env file."
    });
  }
});

// Submit code for scoring (runs against all test cases)
router.post("/submit", async (req, res) => {
  try {
    const { roomId, userId, code, language, versionIndex } = req.body;

    if (!roomId || !userId || !code || !language) {
      return res.status(400).json({ error: "roomId, userId, code, and language are required" });
    }

    // Find the battle room
    const room = await BattleRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Battle room not found" });
    }

    if (room.status !== "ongoing") {
      return res.status(400).json({ error: "Battle has already ended" });
    }

    // Check if user is a player in this room
    const isPlayer1 = room.player1.userId === userId;
    const isPlayer2 = room.player2.userId === userId;
    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({ error: "Not a participant in this battle" });
    }

    const testCases = room.question.testCases;
    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ error: "No test cases available" });
    }

    console.log(`📝 Submitting for user ${userId} in room ${roomId} with ${testCases.length} test cases`);

    // Run code against each test case
    const testResults = [];
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        const result = await executeCode(code, language, testCase.input);
        const output = (result.output || "").trim();
        const expectedOutput = testCase.expectedOutput.trim();
        
        // Normalize comparison (trim whitespace and newlines)
        const normalizedOutput = output.replace(/\r\n/g, '\n').trim();
        const normalizedExpected = expectedOutput.replace(/\r\n/g, '\n').trim();
        
        let passed = normalizedOutput === normalizedExpected;
        
        // Also try JSON comparison for array/object outputs
        if (!passed) {
          try {
            const parsedOutput = JSON.parse(normalizedOutput);
            const parsedExpected = JSON.parse(normalizedExpected);
            passed = JSON.stringify(parsedOutput) === JSON.stringify(parsedExpected);
          } catch {
            // If JSON parsing fails, stick with string comparison
          }
        }

        if (passed) passedCount++;

        testResults.push({
          testCase: i + 1,
          passed,
          expectedOutput,
          actualOutput: output,
          status: result.statusCode === "0" ? "Accepted" : `Exit Code: ${result.statusCode}`,
          memory: result.memory || "0",
          cpuTime: result.cpuTime || "0",
        });
      } catch (testError) {
        console.error(`Test case ${i + 1} error:`, testError.message);
        testResults.push({
          testCase: i + 1,
          passed: false,
          expectedOutput: testCase.expectedOutput,
          actualOutput: "Error: " + testError.message,
          status: "Error",
        });
      }
    }

    // Calculate score (percentage of test cases passed)
    const score = Math.round((passedCount / testCases.length) * 100);
    const verdict = passedCount === testCases.length ? "Accepted" : 
                    passedCount > 0 ? "Partial" : "Wrong Answer";

    console.log(`✅ Submission complete: ${verdict}, score=${score}%, passed=${passedCount}/${testCases.length}`);

    // Emit submitResult to socket (for real-time updates)
    const io = req.app.get("io");
    if (io) {
      io.emit("submitResult", {
        roomId,
        userId,
        code,
        language,
        verdict,
        score,
        testResults,
      });
    }

    res.json({
      verdict,
      score,
      passedCount,
      totalCases: testCases.length,
      testResults,
    });
  } catch (error) {
    console.error("❌ Submit error:", error.message);
    res.status(500).json({
      error: "Failed to submit code",
      details: error.message,
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    jdoodleConfigured: !!JDOODLE_CLIENT_ID && !!JDOODLE_CLIENT_SECRET,
    message: JDOODLE_CLIENT_ID && JDOODLE_CLIENT_SECRET
      ? "JDoodle API is configured" 
      : "JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET are not set. Please add them to your .env file.",
    endpoint: JDOODLE_API_URL,
  });
});

// Get available questions (for testing/debugging)
router.get("/questions", (req, res) => {
  try {
    const simplifiedQuestions = questions.map(q => ({
      id: q.id,
      title: q.title,
      difficulty: q.difficulty,
    }));
    res.json(simplifiedQuestions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

module.exports = router;