const axios = require("axios");

const JUDGE_URL = process.env.JUDGE0_URL;
const API_KEY = process.env.JUDGE0_API_KEY;

const getLanguageId = (lang) => {
  if (lang === "python") return 71;
  if (lang === "javascript") return 63;
  if (lang === "cpp") return 54;
};

exports.runCode = async (req, res) => {
  try {
    const { code, language, input } = req.body;

    const response = await axios.post(
      `${JUDGE_URL}?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: getLanguageId(language),
        stdin: input,
      },
      {
        headers: {
          "X-RapidAPI-Key": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data;

    res.json({
      status: result.status.description,
      time: result.time,
      output: result.stdout || result.stderr || result.compile_output,
    });

  } catch (err) {
    console.error("❌ Judge0 Error:", err.response?.data || err.message);

    res.status(500).json({
      error: "Judge0 failed",
      details: err.response?.data || err.message,
    });
  }
};