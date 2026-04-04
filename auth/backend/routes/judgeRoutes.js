const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  cpp: 54,
};

// POST /api/judge/run — run code with custom input
router.post("/run", verifyToken, async (req, res) => {
  try {
    const { code, language, input } = req.body;
    const languageId = LANGUAGE_IDS[language] || 63;

    const response = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": process.env.JUDGE0_API_HOST,
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: input,
        }),
      }
    );

    const data = await response.json();

    res.json({
      output: data.stdout || data.stderr || data.compile_output || "No output",
      status: data.status?.description || "Unknown",
      time: data.time,
      memory: data.memory,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/judge/submit — run against all test cases
router.post("/submit", verifyToken, async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    const languageId = LANGUAGE_IDS[language] || 63;

    const results = [];
    let allPassed = true;

    for (let tc of testCases) {
      const response = await fetch(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": process.env.JUDGE0_API_HOST,
          },
          body: JSON.stringify({
            source_code: code,
            language_id: languageId,
            stdin: tc.input,
          }),
        }
      );

      const data = await response.json();
      const actualOutput = (data.stdout || "").trim();
      const expectedOutput = tc.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;

      if (!passed) allPassed = false;

      results.push({
        input: tc.input,
        expectedOutput,
        actualOutput,
        passed,
        status: data.status?.description,
      });
    }

    res.json({ results, allPassed });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;