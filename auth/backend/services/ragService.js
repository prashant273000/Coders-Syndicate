/**
 * Shared RAG Service
 * Powers both the XSyndicate Chatbot and Documentation Search
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const TextChunker = require('../utils/rag/textChunker');

class RagService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.embeddingModel = null;
    this.geminiModel = null;
    this.vectorStore = []; // In-memory vector store
    this.chunker = new TextChunker({ chunkSize: 1000, chunkOverlap: 200 });
    
    this.initialize();
  }

  initialize() {
    try {
      if (!this.apiKey) {
        console.error('❌ GEMINI_API_KEY not found in environment variables');
        return;
      }
      
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      // Use gemini-2.0-flash for chat (vector store disabled due to API version mismatch)
      this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      // Skip embedding model - will use Gemini directly for chat without RAG
      console.log('⚠️ Vector store disabled - using direct Gemini chat without RAG context');
      
      console.log('✅ RAG Service initialized with Gemini API');
    } catch (error) {
      console.error('❌ Failed to initialize RAG Service:', error.message);
    }
  }

  /**
   * Generate embedding for text using Google's embedding model
   */
  async generateEmbedding(text) {
    try {
      if (!this.embeddingModel) {
        throw new Error('Embedding model not initialized. Check GEMINI_API_KEY.');
      }

      const result = await this.embeddingModel.embedContent(text);
      const embedding = result.embedding.values;
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Empty embedding returned from API');
      }

      return embedding;
    } catch (error) {
      console.error('❌ generateEmbedding error:', error.message);
      throw error;
    }
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents) {
    try {
      const addedDocs = [];
      
      for (const doc of documents) {
        try {
          const embedding = await this.generateEmbedding(doc.content);
          
          addedDocs.push({
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            embedding,
            content: doc.content,
            metadata: doc.metadata || {},
            title: doc.metadata?.title || doc.content.substring(0, 50) + '...',
            createdAt: new Date(),
          });
        } catch (error) {
          console.error('⚠️ Failed to add document:', error.message);
        }
      }
      
      this.vectorStore.push(...addedDocs);
      console.log(`✅ Added ${addedDocs.length} documents to vector store (total: ${this.vectorStore.length})`);
      
      return addedDocs;
    } catch (error) {
      console.error('❌ addDocuments error:', error.message);
      throw error;
    }
  }

  /**
   * Add raw text to vector store (auto-chunks it)
   */
  async addText(text, metadata = {}) {
    try {
      const cleanedText = this.chunker.cleanText(text);
      const chunks = this.chunker.chunkText(cleanedText, metadata);
      
      console.log(`📝 Chunked text into ${chunks.length} chunks`);
      
      return await this.addDocuments(chunks);
    } catch (error) {
      console.error('❌ addText error:', error.message);
      throw error;
    }
  }

  /**
   * Search vector store for relevant documents
   * Used by both chatbot and documentation search
   */
  async searchVectorStore(query, limit = 5) {
    try {
      if (this.vectorStore.length === 0) {
        console.warn('⚠️ Vector store is empty. Add documents first.');
        return [];
      }

      const queryEmbedding = await this.generateEmbedding(query);
      
      // Calculate cosine similarity for each document
      const results = this.vectorStore.map(doc => ({
        ...doc,
        similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
      }));

      // Sort by similarity (descending) and return top results
      const sorted = results.sort((a, b) => b.similarity - a.similarity);
      const filtered = sorted.slice(0, limit).filter(r => r.similarity > 0.3);

      console.log(`🔍 Found ${filtered.length} relevant documents for query: "${query.substring(0, 50)}..."`);
      
      return filtered;
    } catch (error) {
      console.error('❌ searchVectorStore error:', error.message);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate chat response using retrieved context (for XSyndicate Chatbot)
   */
  async generateChatResponse(userMessage, conversationHistory = []) {
    try {
      console.log(`💬 Generating chat response for: "${userMessage.substring(0, 100)}..."`);
      
      if (!this.geminiModel) {
        throw new Error('Gemini model not initialized. Check GEMINI_API_KEY.');
      }
      
      // Step 1: Search for relevant context (may return empty array)
      let relevantDocs = [];
      try {
        relevantDocs = await this.searchVectorStore(userMessage, 5);
      } catch (searchErr) {
        console.warn('⚠️ Vector search failed, continuing without context:', searchErr.message);
      }
      
      // Step 2: Build context string
      let contextText = '';
      if (relevantDocs.length > 0) {
        contextText = relevantDocs.map((doc, index) => {
          return `[Source ${index + 1}]: ${doc.content}`;
        }).join('\n\n');
      }
      
      // Step 3: Build system prompt - adapt based on whether we have context
      let systemPrompt = '';
      
      if (contextText) {
        // RAG mode - use context
        systemPrompt = `You are XSyndicate, a helpful AI assistant for the Coder_Syndicate platform.

IMPORTANT INSTRUCTIONS:
- Answer the user's question using the provided context below when relevant.
- If the context doesn't contain the answer, use your general knowledge to help.
- Be concise, friendly, and helpful.
- If the context contains code examples, you can reference them.
- Always stay on topic and relevant to the user's question.

RETRIEVED CONTEXT:
${contextText}

${conversationHistory.length > 0 ? `CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
` : ''}
User's Question: ${userMessage}

Your response:`;
      } else {
        // Fallback mode - no context available
        systemPrompt = `You are XSyndicate, a friendly and knowledgeable AI assistant for Coder_Syndicate, a gamified coding learning platform.

You are currently in fallback mode - the knowledge base is being populated, so you should rely on your general programming knowledge to help users.

GUIDELINES:
- Be encouraging and supportive to learners
- Provide clear, accurate programming advice
- Keep responses concise but helpful (under 150 words)
- If asked about platform-specific features, politely mention you're in fallback mode
- Focus on general programming concepts, best practices, and learning advice

${conversationHistory.length > 0 ? `CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
` : ''}
User's Question: ${userMessage}

Your response:`;
      }

      // Step 4: Call Gemini API
      const result = await this.geminiModel.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No text returned from Gemini API');
      }

      return {
        reply: text,
        sources: relevantDocs.map(doc => ({
          content: doc.content.substring(0, 200) + '...',
          similarity: doc.similarity,
          metadata: doc.metadata,
          title: doc.title,
        })),
        contextUsed: relevantDocs.length > 0,
        fallback: relevantDocs.length === 0,
      };
    } catch (error) {
      console.error('❌ generateChatResponse error:', error.message);
      
      // Return detailed error for debugging
      return {
        reply: `I'm experiencing technical difficulties right now. Error: ${error.message}. Please check that your GEMINI_API_KEY is valid and try again.`,
        sources: [],
        contextUsed: false,
        fallback: true,
        error: error.message,
      };
    }
  }

  /**
   * Get vector store statistics
   */
  getStats() {
    return {
      totalDocuments: this.vectorStore.length,
      averageChunkSize: this.vectorStore.length > 0
        ? this.vectorStore.reduce((sum, v) => sum + v.content.length, 0) / this.vectorStore.length
        : 0,
      embeddingDimension: this.vectorStore.length > 0 ? this.vectorStore[0].embedding.length : 768,
      initialized: !!this.geminiModel,
    };
  }

  /**
   * Clear vector store
   */
  clear() {
    this.vectorStore = [];
    console.log('🗑️ Vector store cleared');
  }
}

// Singleton instance
let ragServiceInstance = null;

function getRagService() {
  if (!ragServiceInstance) {
    ragServiceInstance = new RagService();
  }
  return ragServiceInstance;
}

module.exports = {
  RagService,
  getRagService,
};