/**
 * Schemas for AI-generated vocabulary.
 * Used by the generate-vocab API and the teacher UI.
 */

export type AIVocabItem = {
  word: string;
  translation: string;
  definition?: string;
  example?: string;
  pronunciation?: string;
};

export type AIVocabResult = {
  title: string;
  items: AIVocabItem[];
};

/**
 * Maps an AI vocab item to the flashcard card shape (front, back, example).
 * We pack definition and pronunciation into the back field for teacher visibility.
 */
export function aiVocabItemToCard(item: AIVocabItem): {
  front: string;
  back: string;
  example: string;
} {
  const parts: string[] = [item.translation];
  if (item.definition?.trim()) {
    parts.push(`\n\nDefinition: ${item.definition.trim()}`);
  }
  if (item.pronunciation?.trim()) {
    parts.push(`\n\nPronunciation: ${item.pronunciation.trim()}`);
  }
  return {
    front: item.word?.trim() || '',
    back: parts.join('').trim() || item.translation?.trim() || '',
    example: item.example?.trim() || '',
  };
}
