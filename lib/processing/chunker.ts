/**
 * Text Chunking Utility
 * 
 * Splits policy text into overlapping chunks for efficient retrieval and processing.
 * 
 * Strategy:
 * - Target chunk size: 800-1200 words (4000-6000 characters)
 * - Overlap: 150-250 words (800-1000 characters) to preserve context
 * - Split at natural boundaries (paragraphs, sentences) when possible
 * - Preserve chunk index for ordering
 * 
 * Features:
 * - Smart boundary detection (headings, paragraphs, sentences)
 * - Token estimation for LLM context planning
 * - Section title detection for metadata
 * - Maintains document structure
 */

export interface PolicyTextChunk {
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  sectionTitle?: string;
  tokenEstimate: number;
}

// Configuration constants
const TARGET_CHUNK_SIZE = 5000; // characters (roughly 800-1200 words)
const MIN_CHUNK_SIZE = 3000; // characters
const MAX_CHUNK_SIZE = 7000; // characters
const CHUNK_OVERLAP = 900; // characters (roughly 150-200 words)

/**
 * Split policy text into chunks
 * 
 * @param text - Cleaned policy text
 * @returns Array of chunks with metadata
 */
export function chunkPolicyText(text: string): PolicyTextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: PolicyTextChunk[] = [];
  let currentIndex = 0;
  let chunkIndex = 0;

  while (currentIndex < text.length) {
    // Extract chunk with smart boundary detection
    const chunk = extractChunk(text, currentIndex);

    // Detect section title for this chunk
    const sectionTitle = detectSectionTitle(chunk.content);

    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const tokenEstimate = Math.ceil(chunk.content.length / 4);

    chunks.push({
      chunkIndex,
      content: chunk.content,
      sectionTitle,
      tokenEstimate,
      // pageNumber will be null for now (requires page-level parsing)
      pageNumber: undefined,
    });

    // Move to next chunk with overlap
    currentIndex = chunk.endIndex - CHUNK_OVERLAP;
    chunkIndex++;

    // Safety check to prevent infinite loops
    if (chunk.endIndex <= currentIndex) {
      currentIndex = chunk.endIndex;
    }
  }

  return chunks;
}

/**
 * Extract a single chunk from text starting at given index
 * 
 * @param text - Full text
 * @param startIndex - Starting position
 * @returns Chunk content and end index
 */
function extractChunk(
  text: string,
  startIndex: number
): { content: string; endIndex: number } {
  // If remaining text is small, take it all
  if (startIndex + MAX_CHUNK_SIZE >= text.length) {
    return {
      content: text.substring(startIndex).trim(),
      endIndex: text.length,
    };
  }

  // Target end position
  let endIndex = startIndex + TARGET_CHUNK_SIZE;

  // Try to find a good boundary (in order of preference):
  // 1. Double newline (paragraph break)
  // 2. Newline + capital letter (new sentence/paragraph)
  // 3. Period + space + capital (sentence boundary)
  // 4. Period + space (any sentence end)
  // 5. Space (word boundary)

  const searchStart = Math.max(startIndex + MIN_CHUNK_SIZE, endIndex - 500);
  const searchEnd = Math.min(startIndex + MAX_CHUNK_SIZE, text.length);
  const searchText = text.substring(searchStart, searchEnd);

  // Look for paragraph break
  let boundaryIndex = searchText.lastIndexOf('\n\n');
  if (boundaryIndex !== -1) {
    endIndex = searchStart + boundaryIndex + 2;
    return {
      content: text.substring(startIndex, endIndex).trim(),
      endIndex,
    };
  }

  // Look for newline + capital letter
  const newlineCapitalMatch = searchText.match(/\n[A-Z]/g);
  if (newlineCapitalMatch) {
    const lastMatch = searchText.lastIndexOf(newlineCapitalMatch[newlineCapitalMatch.length - 1]);
    if (lastMatch !== -1) {
      endIndex = searchStart + lastMatch + 1;
      return {
        content: text.substring(startIndex, endIndex).trim(),
        endIndex,
      };
    }
  }

  // Look for sentence boundary
  const sentenceBoundaryMatch = searchText.match(/\. [A-Z]/g);
  if (sentenceBoundaryMatch) {
    const lastMatch = searchText.lastIndexOf(sentenceBoundaryMatch[sentenceBoundaryMatch.length - 1]);
    if (lastMatch !== -1) {
      endIndex = searchStart + lastMatch + 2;
      return {
        content: text.substring(startIndex, endIndex).trim(),
        endIndex,
      };
    }
  }

  // Look for any period + space
  boundaryIndex = searchText.lastIndexOf('. ');
  if (boundaryIndex !== -1) {
    endIndex = searchStart + boundaryIndex + 2;
    return {
      content: text.substring(startIndex, endIndex).trim(),
      endIndex,
    };
  }

  // Fall back to word boundary
  boundaryIndex = searchText.lastIndexOf(' ');
  if (boundaryIndex !== -1) {
    endIndex = searchStart + boundaryIndex + 1;
    return {
      content: text.substring(startIndex, endIndex).trim(),
      endIndex,
    };
  }

  // Last resort: hard cut at target size
  return {
    content: text.substring(startIndex, searchEnd).trim(),
    endIndex: searchEnd,
  };
}

/**
 * Detect section title at the beginning of a chunk
 * 
 * @param chunkText - Chunk content
 * @returns Section title if found, undefined otherwise
 */
function detectSectionTitle(chunkText: string): string | undefined {
  const lines = chunkText.split('\n');
  if (lines.length === 0) return undefined;

  const firstLine = lines[0].trim();
  
  // Check if first line looks like a title
  if (firstLine.length === 0 || firstLine.length > 100) {
    return undefined;
  }

  // Heuristics for titles:
  const isAllCaps = firstLine === firstLine.toUpperCase() && /[A-Z]/.test(firstLine);
  const hasNumbering = /^(\d+\.|\d+\)|\w\.|Section \d+|Article \d+|Chapter \d+)/i.test(firstLine);
  const isShort = firstLine.length < 80;
  const endsWithColon = firstLine.endsWith(':');

  if ((isAllCaps || hasNumbering || endsWithColon) && isShort) {
    return firstLine;
  }

  return undefined;
}

/**
 * Estimate token count for a text
 * 
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation:
  // - 1 token ≈ 4 characters for English text
  // - Adjust for spaces and punctuation
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  // Use average of character-based and word-based estimates
  const charEstimate = Math.ceil(charCount / 4);
  const wordEstimate = Math.ceil(wordCount * 1.3); // 1 word ≈ 1.3 tokens

  return Math.floor((charEstimate + wordEstimate) / 2);
}

/**
 * Validate chunk quality
 * 
 * @param chunk - Chunk to validate
 * @returns True if chunk is valid
 */
export function isChunkValid(chunk: PolicyTextChunk): boolean {
  if (!chunk.content || chunk.content.trim().length < 100) {
    return false;
  }

  // Check for reasonable word count
  const words = chunk.content.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 50) {
    return false;
  }

  // Token estimate should be reasonable
  if (chunk.tokenEstimate < 50 || chunk.tokenEstimate > 5000) {
    return false;
  }

  return true;
}

/**
 * Get chunk statistics for a document
 * 
 * @param chunks - Array of chunks
 * @returns Statistics about the chunks
 */
export function getChunkStatistics(chunks: PolicyTextChunk[]): {
  totalChunks: number;
  totalTokens: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      totalTokens: 0,
      avgChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
    };
  }

  const chunkSizes = chunks.map((c) => c.content.length);
  const totalTokens = chunks.reduce((sum, c) => sum + c.tokenEstimate, 0);

  return {
    totalChunks: chunks.length,
    totalTokens,
    avgChunkSize: Math.floor(chunkSizes.reduce((a, b) => a + b, 0) / chunks.length),
    minChunkSize: Math.min(...chunkSizes),
    maxChunkSize: Math.max(...chunkSizes),
  };
}
