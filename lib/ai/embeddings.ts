/**
 * Embedding Generation using Gemini API
 * 
 * Generates vector embeddings for text content to enable semantic search.
 * Uses Google's Gemini text-embedding-004 model (768 dimensions).
 * 
 * Server-side only - never expose to browser.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client (server-side only)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;

// Rate limiting configuration
const DELAY_BETWEEN_REQUESTS_MS = 100; // 100ms delay between requests
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

/**
 * Generate embedding for a single text string
 * 
 * @param text - Text content to embed
 * @returns Vector embedding array (768 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text content is required for embedding generation');
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    // Generate embedding with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.embedContent(text);
        const embedding = result.embedding;

        if (!embedding || !embedding.values || embedding.values.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Invalid embedding response: expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding?.values?.length || 0}`
          );
        }

        return embedding.values;
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('429')) {
          console.log(`[Embeddings] Rate limit hit, retrying in ${RETRY_DELAY_MS}ms... (attempt ${attempt}/${MAX_RETRIES})`);
          
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
            continue;
          }
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }

    // If all retries failed, throw the last error
    throw lastError || new Error('Failed to generate embedding after retries');
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts with rate limiting
 * 
 * @param texts - Array of text strings to embed
 * @param onProgress - Optional callback for progress updates
 * @returns Array of embeddings
 */
export async function generateEmbeddingBatch(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    
    try {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);

      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, texts.length);
      }

      // Add delay between requests to avoid rate limits
      if (i < texts.length - 1) {
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      }
    } catch (error) {
      console.error(`[Embeddings] Failed to embed text ${i + 1}/${texts.length}:`, error);
      throw error;
    }
  }

  return embeddings;
}

/**
 * Test if embedding generation is working
 */
export async function testEmbedding(): Promise<boolean> {
  try {
    const testText = 'This is a test sentence for embedding generation.';
    const embedding = await generateEmbedding(testText);
    
    return embedding.length === EMBEDDING_DIMENSIONS;
  } catch (error) {
    console.error('[Embeddings] Test failed:', error);
    return false;
  }
}

/**
 * Check if embedding service is configured
 */
export function isEmbeddingConfigured(): boolean {
  return !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0);
}

/**
 * Get embedding model metadata
 */
export function getEmbeddingModelInfo() {
  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    provider: 'Google Gemini',
  };
}

/**
 * Utility function to sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text to a maximum length (Gemini has input limits)
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum character length (default: 10000)
 * @returns Truncated text
 */
export function truncateTextForEmbedding(text: string, maxLength: number = 10000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate and add ellipsis
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Prepare chunk content for embedding
 * Cleans and truncates text for optimal embedding quality
 * 
 * @param content - Chunk content
 * @param sectionTitle - Optional section title to include
 * @returns Prepared text for embedding
 */
export function prepareChunkForEmbedding(
  content: string,
  sectionTitle?: string | null
): string {
  // Build text with optional section title
  let text = '';
  
  if (sectionTitle) {
    text = `${sectionTitle}\n\n${content}`;
  } else {
    text = content;
  }

  // Clean and truncate
  text = text.trim();
  text = truncateTextForEmbedding(text);

  return text;
}
