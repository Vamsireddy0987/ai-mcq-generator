export interface ChunkMetadata {
  chunk_index: number;
  chunk_text: string;
  estimated_token_count: number;
}

/**
 * Splits a large text string into smaller overlapping chunks.
 * We approximate 1 token = 4 characters.
 * 
 * @param text The raw extracted text
 * @param maxTokens Maximum tokens per chunk (default 2000)
 * @param overlapTokens Tokens to overlap between chunks (default 200)
 * @returns Array of ChunkMetadata
 */
export function chunkText(text: string, maxTokens = 2000, overlapTokens = 200): ChunkMetadata[] {
  const chunkSizeChars = maxTokens * 4;
  const overlapSizeChars = overlapTokens * 4;
  
  const chunks: ChunkMetadata[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  if (!text || text.length === 0) return chunks;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSizeChars;

    // Adjust endIndex backwards to the nearest space to avoid breaking words
    if (endIndex < text.length) {
      const lastSpace = text.lastIndexOf(' ', endIndex);
      if (lastSpace > startIndex) {
        endIndex = lastSpace;
      }
    }

    const chunkTextStr = text.substring(startIndex, endIndex).trim();
    
    if (chunkTextStr.length > 0) {
      chunks.push({
        chunk_index: chunkIndex,
        chunk_text: chunkTextStr,
        estimated_token_count: Math.ceil(chunkTextStr.length / 4)
      });
      chunkIndex++;
    }

    // Calculate the start index for the next chunk, incorporating overlap
    if (endIndex >= text.length) break;
    
    let nextStart = endIndex - overlapSizeChars;
    if (nextStart < startIndex) {
      nextStart = startIndex; 
    }

    // Adjust nextStart forward to the nearest space to avoid breaking words
    const firstSpace = text.indexOf(' ', nextStart);
    if (firstSpace !== -1 && firstSpace < endIndex) {
      nextStart = firstSpace + 1;
    }

    // Fallback if we get stuck (shouldn't happen with normal text)
    if (nextStart <= startIndex) {
      nextStart = endIndex;
    }

    startIndex = nextStart;
  }

  return chunks;
}
