const express = require('express');
const router = express.Router();
const { getRagService } = require('../services/ragService');

// Import MongoDB models
const RoadmapSession = require('../models/RoadmapSession');
const ContentCache = require('../models/ContentCache');

/**
 * POST /api/roadmap
 * Generate a learning roadmap for a given topic
 */
router.post('/roadmap', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const ragService = getRagService();
    
    if (!ragService.geminiModel) {
      console.error('❌ Gemini model not initialized. Check GEMINI_API_KEY.');
      throw new Error('Gemini model not initialized. Check GEMINI_API_KEY in .env');
    }
    
    const prompt = `Generate a structured learning roadmap for: "${topic}"
Return ONLY a valid JSON array with exactly 6 items. No markdown, no explanation.
Each item must have exactly these fields:
[
  {
    "id": "1",
    "title": "Module Name",
    "icon": "📚",
    "status": "active",
    "description": "One line description"
  }
]
First item status must be "active", rest must be "locked".`;

    const result = await ragService.geminiModel.generateContent(prompt);
    const text = result.response.text();
    
    // Clean and parse JSON
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').replace(/```/g, '').trim();
    const roadmap = JSON.parse(cleaned);
    
    // Ensure we have exactly 6 items with correct structure
    if (!Array.isArray(roadmap) || roadmap.length === 0) {
      throw new Error('Invalid roadmap format from API');
    }
    
    // Save to MongoDB
    await RoadmapSession.create({ topic: topic.toLowerCase(), modules: roadmap });
    
    console.log('✅ Roadmap generated for:', topic);
    res.json(roadmap);
  } catch (err) {
    console.error('❌ Roadmap error:', err.message);
    
    // Fallback roadmap - always return something
    const fallback = [
      { id: "1", title: "Introduction", icon: "📚", status: "active", description: `Getting started with ${req.body.topic || topic}` },
      { id: "2", title: "Core Concepts", icon: "🧠", status: "locked", description: "Fundamental concepts and basics" },
      { id: "3", title: "Practical Examples", icon: "💻", status: "locked", description: "Hands-on examples and exercises" },
      { id: "4", title: "Advanced Topics", icon: "🚀", status: "locked", description: "Advanced techniques and patterns" },
      { id: "5", title: "Best Practices", icon: "✅", status: "locked", description: "Industry best practices" },
      { id: "6", title: "Projects", icon: "🏆", status: "locked", description: "Build real-world projects" }
    ];
    
    res.json(fallback);
  }
});

/**
 * POST /api/content
 * Generate detailed content for a specific module
 */
router.post('/content', async (req, res) => {
  try {
    const { title, topic } = req.body;
    if (!title || !topic) {
      return res.status(400).json({ error: 'Title and topic required' });
    }
    
    // Check cache first
    const cached = await ContentCache.findOne({ 
      topic: topic.toLowerCase(), 
      title: title.toLowerCase() 
    });
    
    if (cached) {
      console.log('✅ Serving from cache:', title);
      return res.json({ content: cached.content });
    }
    
    const ragService = getRagService();
    
    // Search RAG for context (if available)
    let context = '';
    try {
      const relevantDocs = await ragService.searchVectorStore(`${topic} ${title}`, 3);
      context = relevantDocs.map(d => d.content).join('\n\n');
    } catch (searchErr) {
      console.warn('⚠️ RAG search failed:', searchErr.message);
    }
    
    const prompt = `You are an expert coding tutor teaching ${topic}.
Write detailed educational content for the module: "${title}"
${context ? `\nRelevant context from knowledge base:\n${context}\n` : ''}
Include:
- Clear explanation (2-3 paragraphs)
- Key concepts as bullet points
- Code example with syntax highlighting using triple backticks
- Common mistakes to avoid
- One practice exercise

Format as clean markdown. Be thorough but concise.`;

    if (!ragService.geminiModel) {
      throw new Error('Gemini model not initialized');
    }

    const result = await ragService.geminiModel.generateContent(prompt);
    const content = result.response.text();
    
    // Save to cache
    await ContentCache.create({
      topic: topic.toLowerCase(),
      title: title.toLowerCase(),
      content
    });
    
    console.log('✅ Content generated and cached:', title);
    res.json({ content });
  } catch (err) {
    console.error('❌ Content error:', err.message);
    
    // Always return fallback — never crash
    const fallback = `# ${req.body.title}\n\nWelcome to the **${req.body.title}** module in your ${req.body.topic} learning journey.\n\n## Overview\n\nThis module will help you understand the key concepts of ${req.body.title}.\n\n## Key Points\n\n- Study the fundamentals carefully\n- Practice with real examples\n- Build projects to solidify understanding\n\n## Code Example\n\n\`\`\`javascript\n// Example code for ${req.body.title}\nconsole.log("Learning ${req.body.title}");\n\`\`\`\n\n## Common Mistakes\n\n- Not practicing enough\n- Skipping fundamental concepts\n- Not building projects\n\n## Practice Exercise\n\nTry building a small project that uses ${req.body.title} concepts.\n\n*Note: Full AI-generated content temporarily unavailable. Please try again later or check your GEMINI_API_KEY configuration.*`;
    
    res.json({ content: fallback });
  }
});

module.exports = router;