const User = require("../models/user");

const handleAuth = async (req, res) => {
  try {
    const { uid, name, email, picture } = req.user;

    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.create({ uid, name, email, picture });
      console.log("🆕 New user created:", email);
    } else {
      console.log("✅ Existing user found:", email);
    }

    res.status(200).json({
      message: "Authentication successful",
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        picture: user.picture,
        createdAt: user.createdAt,
      },
    });

  } catch (err) {
    console.error("❌ Auth error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { handleAuth };