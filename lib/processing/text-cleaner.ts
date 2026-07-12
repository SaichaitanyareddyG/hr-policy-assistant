/**
 * Text Cleaning Utility
 * 
 * Cleans and normalizes extracted PDF text for better processing and storage.
 * 
 * Features:
 * - Removes excessive whitespace
 * - Normalizes line breaks
 * - Preserves document structure (headings, paragraphs)
 * - Removes page numbers and headers/footers artifacts
 * - Handles common PDF extraction issues
 */

/**
 * Clean extracted text from PDF
 * 
 * @param text - Raw text extracted from PDF
 * @returns Cleaned and normalized text
 */
export function cleanExtractedText(text: string): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  let cleaned = text;

  // 1. Normalize line endings to \n
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Remove excessive blank lines (more than 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 3. Remove common PDF artifacts
  // - Page numbers like "Page 1", "- 1 -", "[1]" at start/end of lines
  cleaned = cleaned.replace(/^Page \d+$/gim, '');
  cleaned = cleaned.replace(/^- \d+ -$/gim, '');
  cleaned = cleaned.replace(/^\[\d+\]$/gim, '');
  cleaned = cleaned.replace(/^\d+$/gim, ''); // standalone numbers on their own line

  // 4. Remove headers/footers that repeat
  // Common patterns like "Confidential" or company names repeated on every page
  cleaned = removeRepeatedLines(cleaned);

  // 5. Fix hyphenation at line breaks
  // "employ-\nee" -> "employee"
  cleaned = cleaned.replace(/(\w+)-\n(\w+)/g, '$1$2');

  // 6. Normalize spaces
  // Multiple spaces to single space
  cleaned = cleaned.replace(/ {2,}/g, ' ');
  // Spaces before punctuation
  cleaned = cleaned.replace(/ ([.,;:!?])/g, '$1');

  // 7. Trim each line
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // 8. Remove empty lines at start/end
  cleaned = cleaned.trim();

  // 9. Ensure reasonable spacing between sections
  // Add space after periods if missing (e.g., "word.Another" -> "word. Another")
  cleaned = cleaned.replace(/([a-z])\.([A-Z])/g, '$1. $2');

  return cleaned;
}

/**
 * Remove repeated lines that appear throughout the text
 * (common with headers/footers in PDFs)
 * 
 * @param text - Text to process
 * @returns Text with repeated lines removed
 */
function removeRepeatedLines(text: string): string {
  const lines = text.split('\n');
  const lineCounts = new Map<string, number>();

  // Count occurrences of each non-empty line
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 100) {
      // Only check short lines (likely headers/footers)
      lineCounts.set(trimmed, (lineCounts.get(trimmed) || 0) + 1);
    }
  });

  // Identify lines that appear very frequently (likely headers/footers)
  const frequentLines = new Set<string>();
  const totalLines = lines.length;
  const threshold = Math.max(3, Math.floor(totalLines / 10)); // Appears more than 10% of the time

  lineCounts.forEach((count, line) => {
    if (count >= threshold) {
      frequentLines.add(line);
    }
  });

  // Remove frequent lines
  const cleaned = lines
    .filter((line) => {
      const trimmed = line.trim();
      return !frequentLines.has(trimmed);
    })
    .join('\n');

  return cleaned;
}

/**
 * Extract potential section titles from text
 * (useful for chunk metadata)
 * 
 * @param text - Text to analyze
 * @returns Array of detected section titles
 */
export function extractSectionTitles(text: string): string[] {
  const titles: string[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Heuristics for detecting titles:
    // - Short lines (< 80 chars)
    // - All caps or Title Case
    // - Followed by blank line or longer paragraph
    // - Contains numbers/letters like "1.", "A.", "Section 1", etc.

    if (line.length === 0 || line.length > 80) continue;

    const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
    const isTitleCase = /^[A-Z][a-z]+(?: [A-Z][a-z]+)*/.test(line);
    const hasNumbering = /^(\d+\.|\d+\)|\w\.|Section \d+|Article \d+|Chapter \d+)/i.test(line);
    const nextLineIsBlank = i + 1 < lines.length && lines[i + 1].trim() === '';

    if ((isAllCaps || isTitleCase || hasNumbering) && nextLineIsBlank) {
      titles.push(line);
    }
  }

  return titles;
}

/**
 * Validate cleaned text quality
 * 
 * @param text - Cleaned text
 * @returns True if text quality is acceptable
 */
export function isTextQualityGood(text: string): boolean {
  if (!text || text.length < 50) return false;

  // Check for reasonable word count
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 20) return false;

  // Check for reasonable character-to-space ratio
  const charCount = text.replace(/\s/g, '').length;
  const spaceCount = text.split(/\s/).length - 1;
  const ratio = charCount / (spaceCount || 1);

  // Typical ratio is 5-10 chars per space
  if (ratio < 3 || ratio > 20) return false;

  return true;
}
