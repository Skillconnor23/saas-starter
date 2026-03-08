/**
 * Schemas for AI-generated quiz.
 * Maps AI output to existing edu_quiz_questions format.
 */

import type { QuizQuestionType } from '@/lib/db/schema';

export const AI_QUESTION_TYPES = ['multiple_choice', 'fill_in_blank', 'true_false'] as const;
export type AIQuestionType = (typeof AI_QUESTION_TYPES)[number];

export type AIMultipleChoiceQuestion = {
  type: 'multiple_choice';
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
};

export type AIFillInBlankQuestion = {
  type: 'fill_in_blank';
  prompt: string;
  answer: string;
  explanation?: string;
};

export type AITrueFalseQuestion = {
  type: 'true_false';
  prompt: string;
  answer: boolean;
  explanation?: string;
};

export type AIQuizQuestion =
  | AIMultipleChoiceQuestion
  | AIFillInBlankQuestion
  | AITrueFalseQuestion;

export type AIQuizResult = {
  title: string;
  instructions?: string;
  questions: AIQuizQuestion[];
};

export type CreateQuestionPayload = {
  type: QuizQuestionType;
  prompt: string;
  choices?: { id: string; label: string; value: string }[] | null;
  correctAnswer: unknown;
  explanation?: string | null;
};

/**
 * Maps AI question to the format expected by addQuestion (edu_quiz_questions).
 */
export function aiQuestionToCreatePayload(q: AIQuizQuestion): CreateQuestionPayload | null {
  if (q.type === 'multiple_choice') {
    const options = q.options ?? [];
    if (options.length < 2 || !q.answer) return null;
    const labels = ['a', 'b', 'c', 'd', 'e'] as const;
    const choices = options.slice(0, 5).map((label, i) => ({
      id: labels[i]!,
      label,
      value: labels[i]!,
    }));
    const correctIndex = options.findIndex(
      (o) => o.trim().toLowerCase() === String(q.answer).trim().toLowerCase()
    );
    const correctValue = correctIndex >= 0 ? labels[correctIndex]! : labels[0]!;
    return {
      type: 'MCQ',
      prompt: q.prompt?.trim() || '',
      choices,
      correctAnswer: correctValue,
      explanation: q.explanation?.trim() || null,
    };
  }
  if (q.type === 'fill_in_blank') {
    if (!q.prompt?.trim() || q.answer == null) return null;
    return {
      type: 'FILL_BLANK',
      prompt: q.prompt.trim(),
      correctAnswer: String(q.answer).trim(),
      explanation: q.explanation?.trim() || null,
    };
  }
  if (q.type === 'true_false') {
    if (!q.prompt?.trim()) return null;
    return {
      type: 'TRUE_FALSE',
      prompt: q.prompt.trim(),
      correctAnswer: q.answer === true,
      explanation: q.explanation?.trim() || null,
    };
  }
  return null;
}
