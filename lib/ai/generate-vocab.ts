'use server';

import OpenAI from 'openai';
import { z } from 'zod';
import type { AIVocabResult } from './schemas';

const aiVocabItemSchema = z.object({
  word: z.string(),
  translation: z.string(),
  definition: z.string().optional().default(''),
  example: z.string().optional().default(''),
  pronunciation: z.string().optional().default(''),
});

const aiVocabResultSchema = z.object({
  title: z.string(),
  items: z.array(aiVocabItemSchema),
});

export type GenerateVocabInput = {
  topic: string;
  level: string;
  studentLanguage: string;
  count: number;
  notes?: string;
};

export async function generateVocabWithOpenAI(
  input: GenerateVocabInput
): Promise<AIVocabResult | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    console.error('[generate-vocab] OPENAI_API_KEY not configured');
    return { error: 'AI service is not configured.' };
  }

  const client = new OpenAI({ apiKey });

  const systemPrompt = `You are an ESL content generator for Gecko Academy. You help bilingual teachers create vocabulary flashcards for their students.

Generate classroom-friendly vocabulary for the provided topic. Keep output level-appropriate for the given proficiency level. Provide accurate native-language translations in the student's language. Use simple, clear definitions. Include one short example sentence per word. Keep everything suitable for teacher review and student study.

You must respond with a single valid JSON object (no markdown) with this exact structure:
{
  "title": "A short title for the vocabulary set",
  "items": [
    {
      "word": "English word",
      "translation": "Translation in student's language",
      "definition": "Simple definition in English",
      "example": "Example sentence using the word",
      "pronunciation": "Phonetic pronunciation (e.g. HOS-pi-tuhl)"
    }
  ]
}`;

  const userPrompt = `Topic: ${input.topic}
Proficiency level: ${input.level}
Student's native language: ${input.studentLanguage}
Number of words to generate: ${input.count}
${input.notes ? `Additional context: ${input.notes}` : ''}

Generate exactly ${input.count} vocabulary items. Return only valid JSON.`;

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
      console.error('[generate-vocab] Empty AI response');
      return { error: 'AI returned no content.' };
    }

    try {
      const json = JSON.parse(content) as unknown;
      const validated = aiVocabResultSchema.safeParse(json);
      if (validated.success && validated.data.items.length > 0) {
        return validated.data;
      }
    } catch {
      // fall through
    }

    console.error('[generate-vocab] Unexpected AI response shape', { content: content.slice(0, 200) });
    return { error: 'AI returned invalid or empty vocabulary.' };
  } catch (err) {
    console.error('[generate-vocab] OpenAI error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('rate') || message.includes('quota')) {
      return { error: 'AI service is temporarily busy. Please try again later.' };
    }
    return { error: 'Failed to generate vocabulary.' };
  }
}
