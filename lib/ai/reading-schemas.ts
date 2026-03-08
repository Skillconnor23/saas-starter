/**
 * Schemas for AI-generated reading content.
 * Maps AI output to existing edu_readings format.
 */

export type AIGlossaryItem = {
  word: string;
  meaning: string;
};

export type AIQuestionItem = {
  prompt: string;
  answer: string;
};

export type AIReadingResult = {
  title: string;
  instructions?: string;
  passage: string;
  glossary?: AIGlossaryItem[];
  questions?: AIQuestionItem[];
};

/**
 * Maps AI reading result to the format expected by createReading.
 * - title -> title
 * - instructions -> description
 * - passage -> content
 * - glossary -> vocab (word only, for highlighting)
 * - questions -> questions (prompt only, as string[])
 */
export function aiReadingToCreatePayload(result: AIReadingResult): {
  title: string;
  description: string | null;
  content: string;
  vocab: string[];
  questions: string[];
} {
  const glossary = result.glossary ?? [];
  const questions = result.questions ?? [];
  return {
    title: result.title?.trim() || 'Untitled reading',
    description: result.instructions?.trim() || null,
    content: result.passage?.trim() || '',
    vocab: glossary.map((g) => g.word?.trim()).filter(Boolean),
    questions: questions.map((q) => q.prompt?.trim()).filter(Boolean),
  };
}
