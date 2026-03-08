'use server';

import OpenAI from 'openai';
import { z } from 'zod';
import type { AIQuizResult } from './quiz-schemas';

const aiMcqSchema = z.object({
  type: z.literal('multiple_choice'),
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(5),
  answer: z.string(),
  explanation: z.string().optional().default(''),
});

const aiFillBlankSchema = z.object({
  type: z.literal('fill_in_blank'),
  prompt: z.string(),
  answer: z.string(),
  explanation: z.string().optional().default(''),
});

const aiTrueFalseSchema = z.object({
  type: z.literal('true_false'),
  prompt: z.string(),
  answer: z.boolean(),
  explanation: z.string().optional().default(''),
});

const aiQuestionSchema = z.discriminatedUnion('type', [
  aiMcqSchema,
  aiFillBlankSchema,
  aiTrueFalseSchema,
]);

const aiQuizResultSchema = z.object({
  title: z.string(),
  instructions: z.string().optional().default(''),
  questions: z.array(aiQuestionSchema),
});

export type GenerateQuizInput = {
  topic: string;
  level: string;
  studentLanguage: string;
  questionCount: number;
  questionTypes?: string[];
  notes?: string;
  vocabItems?: Array<{
    word: string;
    translation?: string;
    definition?: string;
    example?: string;
    pronunciation?: string;
  }>;
};

export async function generateQuizWithOpenAI(
  input: GenerateQuizInput
): Promise<AIQuizResult | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    console.error('[generate-quiz] OPENAI_API_KEY not configured');
    return { error: 'AI service is not configured.' };
  }

  const client = new OpenAI({ apiKey });

  const typesList = (input.questionTypes ?? ['multiple_choice', 'fill_in_blank', 'true_false'])
    .filter((t) => ['multiple_choice', 'fill_in_blank', 'true_false'].includes(t))
    .join(', ') || 'multiple_choice, fill_in_blank, true_false';

  const vocabContext =
    input.vocabItems && input.vocabItems.length > 0
      ? `\nUse these vocabulary items in your questions where appropriate:\n${input.vocabItems
          .map((v) => `- ${v.word}${v.translation ? ` (${v.translation})` : ''}`)
          .join('\n')}`
      : '';

  const systemPrompt = `You are an ESL quiz generator for Gecko Academy. You help bilingual teachers create quiz questions for their students.

Create level-appropriate ESL quiz questions. Use simple, classroom-friendly English. Support beginner/intermediate-friendly wording. Create clean, answerable questions. Avoid trick questions. Include correct answers. For multiple choice, use plausible but simple distractors. For fill in blank, keep the sentence short. Keep everything suitable for teacher review and student learning.

You must respond with a single valid JSON object (no markdown) with this exact structure:
{
  "title": "Quiz title",
  "instructions": "Optional short instructions for students",
  "questions": [
    {
      "type": "multiple_choice",
      "prompt": "Which place helps sick people?",
      "options": ["hospital", "bank", "park", "bus stop"],
      "answer": "hospital",
      "explanation": "Optional explanation"
    },
    {
      "type": "fill_in_blank",
      "prompt": "The ______ is next to the bank.",
      "answer": "hospital",
      "explanation": "Optional"
    },
    {
      "type": "true_false",
      "prompt": "A hospital helps sick people.",
      "answer": true,
      "explanation": "Optional"
    }
  ]
}

Allowed question types: multiple_choice, fill_in_blank, true_false.`;

  const userPrompt = `Topic: ${input.topic}
Proficiency level: ${input.level}
Student's native language: ${input.studentLanguage}
Number of questions: ${input.questionCount}
Question types to use: ${typesList}
${input.notes ? `Lesson context: ${input.notes}` : ''}${vocabContext}

Generate exactly ${input.questionCount} questions. Use a mix of the requested types. Return only valid JSON.`;

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
      console.error('[generate-quiz] Empty AI response');
      return { error: 'AI returned no content.' };
    }

    try {
      const json = JSON.parse(content) as unknown;
      const validated = aiQuizResultSchema.safeParse(json);
      if (validated.success && validated.data.questions.length > 0) {
        return validated.data;
      }
    } catch {
      // fall through
    }

    console.error('[generate-quiz] Unexpected AI response shape', { content: content.slice(0, 300) });
    return { error: 'AI returned invalid or empty quiz.' };
  } catch (err) {
    console.error('[generate-quiz] OpenAI error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('rate') || message.includes('quota')) {
      return { error: 'AI service is temporarily busy. Please try again later.' };
    }
    return { error: 'Failed to generate quiz.' };
  }
}
