'use server';

import { revalidatePath } from 'next/cache';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import { requireRole } from '@/lib/auth/user';
import {
  markReadingComplete as dbMarkReadingComplete,
  createReading as dbCreateReading,
  updateReading as dbUpdateReading,
  getReadingForTeacher,
} from '@/lib/db/queries/readings';
import { listClassesForTeacher } from '@/lib/db/queries/education';

function linesToArray(s: string | null | undefined): string[] {
  if (!s || typeof s !== 'string') return [];
  return s
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function markReadingCompleteAction(formData: FormData): Promise<void> {
  const readingId = formData.get('readingId');
  if (typeof readingId !== 'string' || !readingId) return;
  const user = await requireRole(['student']);
  const result = await dbMarkReadingComplete(readingId, user.id);
  if (!result.ok) return;
  revalidatePath('/dashboard/student/learning');
  revalidatePath(`/dashboard/student/learning/reading/${readingId}`);
}

export type CreateReadingFromDraftPayload = {
  title: string;
  description?: string | null;
  content: string;
  vocab?: string[];
  questions?: string[];
};

export async function createReadingFromDraftAction(
  classId: string,
  draft: CreateReadingFromDraftPayload
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const classes = await listClassesForTeacher(user.id);
  if (!classes.some((c) => c.id === classId)) {
    return { error: 'You do not have access to that class.' };
  }
  if (!draft.title?.trim() || !draft.content?.trim()) {
    return { error: 'Title and reading content are required.' };
  }
  const reading = await dbCreateReading({
    classId,
    title: draft.title.trim(),
    description: draft.description ?? null,
    content: draft.content.trim(),
    vocab: draft.vocab ?? [],
    questions: draft.questions ?? [],
  });
  revalidatePath('/dashboard/teacher/learning-tools');
  await redirectWithLocale(`/dashboard/teacher/learning-tools/readings/${reading.id}/edit`);
  return { error: undefined }; // unreachable; redirect throws
}

export async function createReadingAction(formData: FormData): Promise<void> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const classId = formData.get('classId');
  const title = formData.get('title');
  const content = formData.get('content');
  if (typeof classId !== 'string' || !classId || typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    await redirectWithLocale('/dashboard/teacher/learning-tools/readings/new?error=missing');
  }
  const classes = await listClassesForTeacher(user.id);
  if (!classes.some((c) => c.id === (classId as string))) {
    await redirectWithLocale('/dashboard/teacher/learning-tools/readings/new?error=unauthorized');
  }
  const vocabRaw = formData.get('vocabulary');
  const questionsRaw = formData.get('questions');
  const vocab = linesToArray(typeof vocabRaw === 'string' ? vocabRaw : null);
  const questions = linesToArray(typeof questionsRaw === 'string' ? questionsRaw : null);
  const reading = await dbCreateReading({
    classId: classId as string,
    title: (title as string).trim(),
    content: (content as string).trim(),
    vocab,
    questions,
  });
  revalidatePath('/dashboard/teacher/learning-tools');
  await redirectWithLocale(`/dashboard/teacher/learning-tools/readings/${reading.id}/edit`);
}

export async function updateReadingAction(formData: FormData): Promise<void> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const readingId = formData.get('readingId');
  const title = formData.get('title');
  const content = formData.get('content');
  if (typeof readingId !== 'string' || !readingId || typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    await redirectWithLocale(`/dashboard/teacher/learning-tools/readings/${readingId}/edit?error=missing`);
  }
  const existing = await getReadingForTeacher(readingId as string, user.id);
  if (!existing) {
    await redirectWithLocale('/dashboard/teacher/learning-tools?error=unauthorized');
  }
  const vocabRaw = formData.get('vocabulary');
  const questionsRaw = formData.get('questions');
  const vocab = linesToArray(typeof vocabRaw === 'string' ? vocabRaw : null);
  const questions = linesToArray(typeof questionsRaw === 'string' ? questionsRaw : null);
  await dbUpdateReading(readingId as string, {
    title: (title as string).trim(),
    content: (content as string).trim(),
    vocab,
    questions,
  });
  revalidatePath('/dashboard/teacher/learning-tools');
  revalidatePath(`/dashboard/teacher/learning-tools/readings/${readingId}/edit`);
  await redirectWithLocale(`/dashboard/teacher/learning-tools/readings/${readingId}/edit`);
}
