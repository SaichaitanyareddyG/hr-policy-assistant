/**
 * PDF Text Extraction Utility
 * 
 * Extracts text from PDF files using pdf-parse library.
 * Works only on server-side (Next.js Server Actions, API Routes, Server Components).
 * 
 * Features:
 * - Extracts text from text-based PDFs
 * - Detects scanned/image-based PDFs (no selectable text)
 * - Returns metadata (pages, text length)
 * - Error handling for corrupt or password-protected PDFs
 */

import { createClient } from '@/lib/supabase/server';

// pdf-parse is a CommonJS module, use dynamic import
const parsePdf = async (buffer: Buffer) => {
  const pdfParse = (await import('pdf-parse')) as any;
  return (pdfParse.default || pdfParse)(buffer);
};

export interface PdfExtractionResult {
  success: boolean;
  text: string;
  pages: number;
  textLength: number;
  needsOcr: boolean;
  error?: string;
}

/**
 * Extract text from a PDF file stored in Supabase Storage
 * 
 * @param filePath - The storage path of the PDF file (e.g., "org_id/document_id/filename.pdf")
 * @returns Extraction result with text and metadata
 */
export async function extractTextFromPolicyPdf(
  filePath: string
): Promise<PdfExtractionResult> {
  try {
    // 1. Download PDF from Supabase Storage
    const supabase = await createClient();
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('policy-documents')
      .download(filePath);

    if (downloadError) {
      return {
        success: false,
        text: '',
        pages: 0,
        textLength: 0,
        needsOcr: false,
        error: `Failed to download PDF from storage: ${downloadError.message}`,
      };
    }

    if (!fileData) {
      return {
        success: false,
        text: '',
        pages: 0,
        textLength: 0,
        needsOcr: false,
        error: 'PDF file not found in storage',
      };
    }

    // 2. Convert Blob to Buffer for pdf-parse
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Extract text using pdf-parse
    const pdfData = await parsePdf(buffer);

    const extractedText = pdfData.text || '';
    const textLength = extractedText.trim().length;
    const pages = pdfData.numpages || 0;

    // 4. Check if PDF is scanned/image-based (very little or no text)
    // Heuristic: If text is less than 100 characters for a multi-page document,
    // it's likely scanned or image-based
    const minTextPerPage = 50; // characters
    const expectedMinText = pages * minTextPerPage;
    const needsOcr = textLength < Math.min(expectedMinText, 100);

    if (needsOcr) {
      return {
        success: false,
        text: extractedText,
        pages,
        textLength,
        needsOcr: true,
        error: 'No selectable text found. This PDF may be scanned or image-based. OCR support will be added later.',
      };
    }

    // 5. Success!
    return {
      success: true,
      text: extractedText,
      pages,
      textLength,
      needsOcr: false,
    };
  } catch (error) {
    // Handle various PDF parsing errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Common error patterns
    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      return {
        success: false,
        text: '',
        pages: 0,
        textLength: 0,
        needsOcr: false,
        error: 'PDF is password-protected or encrypted. Please upload an unprotected PDF.',
      };
    }

    if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupted')) {
      return {
        success: false,
        text: '',
        pages: 0,
        textLength: 0,
        needsOcr: false,
        error: 'PDF file is corrupt or invalid. Please re-upload a valid PDF.',
      };
    }

    // Generic error
    return {
      success: false,
      text: '',
      pages: 0,
      textLength: 0,
      needsOcr: false,
      error: `PDF extraction failed: ${errorMessage}`,
    };
  }
}

/**
 * Validate if a file can be processed as a PDF
 * 
 * @param filePath - Storage path of the file
 * @returns True if file is likely a valid PDF
 */
export function isPdfFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.pdf');
}

/**
 * Estimate processing time based on file size
 * 
 * @param fileSize - File size in bytes
 * @returns Estimated processing time in seconds
 */
export function estimateProcessingTime(fileSize: number): number {
  // Rough estimate: 1MB = 2-3 seconds processing time
  const mbSize = fileSize / (1024 * 1024);
  return Math.ceil(mbSize * 2.5);
}
