//require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const docs = {
    "opengl" : "https://learnopengl.com/"
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
// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});