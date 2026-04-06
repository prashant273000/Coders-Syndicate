/**
 * Vector Store Manager for RAG System
 * Uses ChromaDB for vector storage and Google's embedding model
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const TextChunker = require('./textChunker');

class VectorStoreManager {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    if (!this.geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found. Embeddings will not work.');
    }
    
    this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // In-memory vector store (for simplicity, can be replaced with ChromaDB)
    // Format: { id, embedding, content, metadata }
    this.vectors = [];
    this.chunker = new TextChunker({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    console.log('✅ VectorStoreManager initialized');
  }

  /**
   * Generate embedding for a given text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      if (!this.embeddingModel) {
        throw new Error('Embedding model not initialized');
      }

      const result = await this.embeddingModel.embedContent(text);
      const embedding = result.embedding.values;
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Empty embedding returned');
      }

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error.message);
      // Return a zero vector as fallback
      return new Array(768).fill(0);
    }
  }

  /**
   * Add documents to the vector store
   * @param {Array<{content: string, metadata: object}>} documents - Documents to add
   * @returns {Promise<Array>} - Added document IDs
   */
  async addDocuments(documents) {
    const addedIds = [];

    for (const doc of documents) {
      try {
        const embedding = await this.generateEmbedding(doc.content);
        
        const vectorDoc = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          embedding,
          content: doc.content,
          metadata: doc.metadata || {},
          createdAt: new Date(),
        };

        this.vectors.push(vectorDoc);
        addedIds.push(vectorDoc.id);

        console.log(`📄 Added document: ${vectorDoc.id} (${doc.content.length} chars)`);
      } catch (error) {
        console.error('Error adding document:', error.message);
      }
    }

    console.log(`✅ Added ${addedIds.length} documents to vector store`);
    return addedIds;
  }

  /**
   * Add raw text to the vector store (auto-chunks it)
   * @param {string} text - Raw text to add
   * @param {object} metadata - Optional metadata
   * @returns {Promise<Array>} - Added document IDs
   */
  async addText(text, metadata = {}) {
    const cleanedText = this.chunker.cleanText(text);
    const chunks = this.chunker.chunkText(cleanedText, metadata);
    
    console.log(`📝 Chunked text into ${chunks.length} chunks`);
    
    return await this.addDocuments(chunks);
  }

  /**
   * Perform similarity search
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @returns {Promise<Array>} - Most similar documents
   */
  async similaritySearch(query, topK = 5) {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      return await this.similaritySearchByVector(queryEmbedding, topK);
    } catch (error) {
      console.error('Error in similarity search:', error.message);
      return [];
    }
  }

  /**
   * Perform similarity search using a pre-computed embedding
   * @param {number[]} queryVector - Query embedding vector
   * @param {number} topK - Number of results to return
   * @returns {Array} - Most similar documents
   */
  similaritySearchByVector(queryVector, topK = 5) {
    if (this.vectors.length === 0) {
      console.warn('⚠️ Vector store is empty');
      return [];
    }

    // Calculate cosine similarity for each vector
    const similarities = this.vectors.map(vector => ({
      ...vector,
      similarity: this.cosineSimilarity(queryVector, vector.embedding),
    }));

    // Sort by similarity (descending) and return top K
    const sorted = similarities.sort((a, b) => b.similarity - a.similarity);
    const results = sorted.slice(0, topK);

    // Filter out low similarity results (threshold: 0.3)
    return results.filter(r => r.similarity > 0.3);
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} - Similarity score (0-1)
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
   * Get statistics about the vector store
   * @returns {object}
   */
  getStats() {
    return {
      totalDocuments: this.vectors.length,
      totalChunks: this.vectors.length,
      averageChunkSize: this.vectors.length > 0
        ? this.vectors.reduce((sum, v) => sum + v.content.length, 0) / this.vectors.length
        : 0,
      embeddingDimension: this.vectors.length > 0 ? this.vectors[0].embedding.length : 0,
    };
  }

  /**
   * Clear all vectors from the store
   */
  clear() {
    this.vectors = [];
    console.log('🗑️ Vector store cleared');
  }

  /**
   * Export vectors to JSON (for persistence)
   * @returns {string} - JSON string
   */
  exportToJSON() {
    return JSON.stringify(this.vectors, null, 2);
  }

  /**
   * Import vectors from JSON
   * @param {string} jsonString - JSON string
   */
  importFromJSON(jsonString) {
    try {
      this.vectors = JSON.parse(jsonString);
      console.log(`📥 Imported ${this.vectors.length} vectors from JSON`);
    } catch (error) {
      console.error('Error importing from JSON:', error.message);
    }
  }
}

// Singleton instance
let vectorStoreInstance = null;

function getVectorStore() {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStoreManager();
  }
  return vectorStoreInstance;
}

module.exports = {
  VectorStoreManager,
  getVectorStore,
};