import OpenAI from 'openai';
import { z } from 'zod';
import type { AIHomeworkResult, AIHomeworkTask } from './homework-schemas';

const taskSchema = z.object({
  type: z.enum(['fill_in_blank', 'short_answer', 'speaking', 'writing', 'reading_comprehension']),
  prompt: z.string(),
  answer: z.string().nullable(),
});

const aiHomeworkResultSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  tasks: z.array(taskSchema),
  teacherNotes: z.string().optional(),
});

export type GenerateHomeworkInput = {
  topic: string;
  level: string;
  studentLanguage: string;
  taskCount?: number;
  notes?: string;
  vocabItems?: Array<{
    word: string;
    translation?: string;
    definition?: string;
    example?: string;
    pronunciation?: string;
  }>;
  reading?: {
    title?: string;
    passage?: string;
  };
};

export async function generateHomeworkWithOpenAI(
  input: GenerateHomeworkInput
): Promise<AIHomeworkResult | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    console.error('[generate-homework] OPENAI_API_KEY not configured');
    return { error: 'AI service is not configured.' };
  }

  const client = new OpenAI({ apiKey });
  const taskCount = Math.min(10, Math.max(1, input.taskCount ?? 5));

  const vocabContext =
    input.vocabItems && input.vocabItems.length > 0
      ? `\nUse these vocabulary words in tasks where natural:\n${input.vocabItems
          .map((v) => `- ${v.word}${v.translation ? ` (${v.translation})` : ''}`)
          .join('\n')}`
      : '';

  const readingContext =
    input.reading?.passage?.trim()
      ? `\nOptional: Create 1-2 reading comprehension tasks based on this passage:\nTitle: ${input.reading.title ?? 'Reading'}\nPassage: ${input.reading.passage.slice(0, 1500)}`
      : '';

  const systemPrompt = `You are an ESL homework generator for Gecko Academy. You help bilingual teachers create homework assignments for their students.

Create level-appropriate ESL homework. Use simple, classroom-friendly English. Keep instructions easy to understand. Generate a practical homework set that reinforces what was taught. Include a mix of task types when appropriate (fill_in_blank, short_answer, speaking, writing, reading_comprehension). Prioritize assignments that reinforce classroom learning. Avoid overly advanced grammar or vocabulary.

You must respond with a single valid JSON object (no markdown) with this exact structure:
{
  "title": "Short title for the homework",
  "instructions": "Brief overall instructions (e.g. Complete the tasks below.)",
  "tasks": [
    {
      "type": "fill_in_blank",
      "prompt": "The sentence with ______ for the blank (student sees this)",
      "answer": "correct answer for teacher"
    },
    {
      "type": "short_answer",
      "prompt": "Question or instruction for student",
      "answer": null
    },
    {
      "type": "speaking",
      "prompt": "Record yourself saying: [sentence]",
      "answer": null
    }
  ],
  "teacherNotes": "Optional tips for grading or teaching"
}`;

  const userPrompt = `Topic: ${input.topic}
Proficiency level: ${input.level}
Student's native language: ${input.studentLanguage}
Number of tasks: ${taskCount}
${input.notes ? `Lesson context: ${input.notes}` : ''}${vocabContext}${readingContext}

Generate a homework assignment with ${taskCount} tasks. Use a mix of types. Include teacher notes if helpful. Return only valid JSON.`;

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
      console.error('[generate-homework] Empty AI response');
      return { error: 'AI returned no content.' };
    }

    try {
      const json = JSON.parse(content) as unknown;
      const validated = aiHomeworkResultSchema.safeParse(json);
      if (validated.success && validated.data.tasks?.length > 0) {
        return validated.data as AIHomeworkResult;
      }
    } catch {
      // fall through
    }

    console.error('[generate-homework] Unexpected AI response shape', { content: content.slice(0, 300) });
    return { error: 'AI returned invalid or empty homework.' };
  } catch (err) {
    console.error('[generate-homework] OpenAI error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('rate') || message.includes('quota')) {
      return { error: 'AI service is temporarily busy. Please try again later.' };
    }
    return { error: 'Failed to generate homework.' };
  }
}
