const admin = require("firebase-admin");

const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(" ")[1];

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;

    next();
  } catch (err) {
    console.error("❌ Token Error:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyToken;