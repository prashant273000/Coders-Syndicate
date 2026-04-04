const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

const LANGUAGE_MAP = {
  javascript: { language: "nodejs", versionIndex: "4" },
  python:     { language: "python3", versionIndex: "4" },
  cpp:        { language: "cpp17", versionIndex: "1" },
};

const prepareCode = (code, language) => {
  if (language === "cpp" && !code.includes("#include")) {
    return `#include <bits/stdc++.h>\nusing namespace std;\n\n${code}`;
  }
  return code;
};

const jdoodleRequest = async (code, language, input) => {
  const lang = LANGUAGE_MAP[language] || LANGUAGE_MAP.javascript;
  code = prepareCode(code, language);

  const response = await fetch("https://api.jdoodle.com/v1/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId:     process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script:       code,
      language:     lang.language,
      versionIndex: lang.versionIndex,
      stdin:        input || "",
    }),
  });

  return response.json();
};

// POST /api/judge/run — run code with custom input
router.post("/run", verifyToken, async (req, res) => {
  try {
    const { code, language, input } = req.body;
    const data = await jdoodleRequest(code, language, input);

    res.json({
      output: data.output || "No output",
      status: data.statusCode === 200 ? "Accepted" : "Error",
      time:   data.cpuTime,
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

    const results = [];
    let allPassed = true;

    for (let tc of testCases) {
      const data = await jdoodleRequest(code, language, tc.input);

      const actualOutput   = (data.output || "").trim();
      const expectedOutput = tc.expectedOutput.trim();
      const passed         = actualOutput === expectedOutput;

      if (!passed) allPassed = false;

      results.push({
        input: tc.input,
        expectedOutput,
        actualOutput,
        passed,
        status: data.statusCode === 200 ? "Accepted" : "Error",
      });
    }

    res.json({ results, allPassed });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;