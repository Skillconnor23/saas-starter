import OpenAI from 'openai';
import { z } from 'zod';
import type { AIReadingResult } from './reading-schemas';

const glossaryItemSchema = z.object({
  word: z.string(),
  meaning: z.string(),
});

const questionItemSchema = z.object({
  prompt: z.string(),
  answer: z.string(),
});

const aiReadingResultSchema = z.object({
  title: z.string(),
  instructions: z.string().optional().default(''),
  passage: z.string(),
  glossary: z.array(glossaryItemSchema).optional().default([]),
  questions: z.array(questionItemSchema).optional().default([]),
});

export type GenerateReadingInput = {
  topic: string;
  level: string;
  studentLanguage: string;
  paragraphCount?: number;
  notes?: string;
  vocabItems?: Array<{
    word: string;
    translation?: string;
    definition?: string;
    example?: string;
    pronunciation?: string;
  }>;
};

export async function generateReadingWithOpenAI(
  input: GenerateReadingInput
): Promise<AIReadingResult | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    console.error('[generate-reading] OPENAI_API_KEY not configured');
    return { error: 'AI service is not configured.' };
  }

  const client = new OpenAI({ apiKey });
  const paragraphCount = Math.min(5, Math.max(1, input.paragraphCount ?? 2));

  const vocabContext =
    input.vocabItems && input.vocabItems.length > 0
      ? `\nUse these vocabulary words in your passage where natural:\n${input.vocabItems
          .map((v) => `- ${v.word}${v.translation ? ` (${v.translation})` : ''}`)
          .join('\n')}`
      : '';

  const systemPrompt = `You are an ESL reading passage generator for Gecko Academy. You help bilingual teachers create reading content for their students.

Create a level-appropriate ESL reading passage. Use simple, classroom-friendly English. Make the reading understandable for the specified level. Keep sentence structure appropriate for ESL learners. Avoid advanced idioms and confusing wording. Naturally include target vocabulary when provided.

You must respond with a single valid JSON object (no markdown) with this exact structure:
{
  "title": "Short title for the reading",
  "instructions": "Optional short instructions for students (e.g. Read the passage and answer the questions.)",
  "passage": "The main reading passage. Use simple paragraphs.",
  "glossary": [
    { "word": "vocabulary word", "meaning": "Simple definition or translation" }
  ],
  "questions": [
    { "prompt": "Comprehension question?", "answer": "Brief answer for teacher reference" }
  ]
}`;

  const userPrompt = `Topic: ${input.topic}
Proficiency level: ${input.level}
Student's native language: ${input.studentLanguage}
Number of paragraphs: ${paragraphCount}
${input.notes ? `Lesson context: ${input.notes}` : ''}${vocabContext}

Generate a reading passage of about ${paragraphCount} paragraph(s). Include 3-6 glossary items (key vocabulary from the passage) and 2-4 simple comprehension questions. Return only valid JSON.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content?.trim()) {
      console.error('[generate-reading] Empty AI response');
      return { error: 'AI returned no content.' };
    }

    try {
      const json = JSON.parse(content) as unknown;
      const validated = aiReadingResultSchema.safeParse(json);
      if (validated.success && validated.data.passage?.trim()) {
        return validated.data;
      }
    } catch {
      // fall through
    }

    console.error('[generate-reading] Unexpected AI response shape', { content: content.slice(0, 300) });
    return { error: 'AI returned invalid or empty reading.' };
  } catch (err) {
    console.error('[generate-reading] OpenAI error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('rate') || message.includes('quota')) {
      return { error: 'AI service is temporarily busy. Please try again later.' };
    }
    return { error: 'Failed to generate reading.' };
  }
}
