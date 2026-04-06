/**
 * Text Chunking Utility for RAG System
 * Splits large text into manageable chunks with overlap for context preservation
 */

class TextChunker {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000; // Characters per chunk
    this.chunkOverlap = options.chunkOverlap || 200; // Overlap between chunks
    this.separator = options.separator || '\n'; // Default separator
  }

  /**
   * Split text into chunks with overlap
   * @param {string} text - The text to chunk
   * @returns {Array<{content: string, metadata: object}>}
   */
  chunkText(text, metadata = {}) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks = [];
    let start = 0;
    const textLength = text.length;

    while (start < textLength) {
      // Calculate end position
      let end = start + this.chunkSize;
      
      // If we're at the end, just take what's left
      if (end >= textLength) {
        const chunk = text.substring(start).trim();
        if (chunk.length > 0) {
          chunks.push({
            content: chunk,
            metadata: {
              ...metadata,
              chunkIndex: chunks.length,
              startChar: start,
              endChar: textLength,
              isLastChunk: true,
            }
          });
        }
        break;
      }

      // Try to find a natural break point (sentence or paragraph)
      const breakPoint = this.findBreakPoint(text, start, end);
      end = breakPoint;

      const chunk = text.substring(start, end).trim();
      if (chunk.length > 0) {
        chunks.push({
          content: chunk,
          metadata: {
            ...metadata,
            chunkIndex: chunks.length,
            startChar: start,
            endChar: end,
            isLastChunk: false,
          }
        });
      }

      // Move start position with overlap
      start = end - this.chunkOverlap;
      if (start < 0) start = 0;
    }

    return chunks;
  }

  /**
   * Find a natural break point in the text
   */
  findBreakPoint(text, start, end) {
    const substring = text.substring(start, end);
    
    // Try to break at paragraph boundaries
    let breakIndex = substring.lastIndexOf('\n\n');
    if (breakIndex > substring.length * 0.5) {
      return start + breakIndex + 2; // +2 for the double newline
    }

    // Try to break at sentence boundaries
    breakIndex = substring.lastIndexOf('. ');
    if (breakIndex > substring.length * 0.5) {
      return start + breakIndex + 2; // +2 for '. '
    }

    // Try to break at line boundaries
    breakIndex = substring.lastIndexOf('\n');
    if (breakIndex > substring.length * 0.5) {
      return start + breakIndex + 1;
    }

    // Try to break at space
    breakIndex = substring.lastIndexOf(' ');
    if (breakIndex > substring.length * 0.5) {
      return start + breakIndex + 1;
    }

    // If no good break point, just use the end
    return end;
  }

  /**
   * Clean and preprocess text before chunking
   */
  cleanText(text) {
    if (!text) return '';
    
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ');
    
    // Remove special characters that might interfere
    cleaned = cleaned.replace(/[^\w\s.,;:!?'"()\-\n]/g, '');
    
    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');
    
    return cleaned.trim();
  }

  /**
   * Estimate token count (rough approximation)
   * English text: ~4 characters per token
   */
  estimateTokenCount(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Split text by a maximum token count
   */
  chunkByTokens(text, maxTokens = 1000, overlap = 200) {
    if (!text) return [];

    const chunks = [];
    let start = 0;
    const textLength = text.length;
    const charsPerToken = 4; // Approximate
    const maxChars = maxTokens * charsPerToken;
    const overlapChars = overlap * charsPerToken;

    while (start < textLength) {
      let end = Math.min(start + maxChars, textLength);
      
      if (end >= textLength) {
        const chunk = text.substring(start).trim();
        if (chunk.length > 0) {
          chunks.push({
            content: chunk,
            metadata: {
              estimatedTokens: this.estimateTokenCount(chunk),
              chunkIndex: chunks.length,
            }
          });
        }
        break;
      }

      // Find break point
      const breakPoint = this.findBreakPoint(text, start, end);
      end = breakPoint;

      const chunk = text.substring(start, end).trim();
      if (chunk.length > 0) {
        chunks.push({
          content: chunk,
          metadata: {
            estimatedTokens: this.estimateTokenCount(chunk),
            chunkIndex: chunks.length,
          }
        });
      }

      start = end - overlapChars;
      if (start < 0) start = 0;
    }

    return chunks;
  }
}

module.exports = TextChunker;