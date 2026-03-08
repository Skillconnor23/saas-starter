'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import { requireRole } from '@/lib/auth/user';
import { getUser } from '@/lib/db/queries';
import {
  createQuiz as dbCreateQuiz,
  updateQuiz as dbUpdateQuiz,
  publishQuiz as dbPublishQuiz,
  addQuestion as dbAddQuestion,
  addQuestionsBulk as dbAddQuestionsBulk,
  updateQuestion as dbUpdateQuestion,
  deleteQuestion as dbDeleteQuestion,
  reorderQuestions as dbReorderQuestions,
  getQuizForStudent as dbGetQuizForStudent,
  createQuizSubmission as dbCreateQuizSubmission,
  getTeacherQuizResults as dbGetTeacherQuizResults,
  getAdminOverview as dbGetAdminOverview,
  getQuizClassIds,
} from '@/lib/db/queries/quizzes';
import {
  getClassById,
  hasTeacherAssignment,
  createQuizFeedPosts,
} from '@/lib/db/queries/education';
import type { QuizQuestionType } from '@/lib/db/schema';

const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  classIds: z
    .union([
      z.string().transform((s) => (s ? [s] : [])),
      z.array(z.string()),
    ])
    .pipe(z.array(z.string().uuid()).min(1, 'Select at least one class')),
});

export async function createQuizAction(formData: FormData) {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const classIdsRaw = formData.getAll('classIds');
  const classIdsArr = Array.isArray(classIdsRaw)
    ? classIdsRaw
    : typeof classIdsRaw === 'string'
      ? classIdsRaw ? [classIdsRaw] : []
      : [];
  const parsed = createQuizSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    classIds: classIdsArr,
  });
  if (!parsed.success) {
    await redirectWithLocale(`/teacher/quizzes/new?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? 'Validation failed')}`);
  }
  const data = parsed.data!;

  if (user.platformRole === 'teacher') {
    for (const classId of data.classIds) {
      const assigned = await hasTeacherAssignment(classId, user.id);
      if (!assigned) {
        await redirectWithLocale(`/teacher/quizzes/new?error=${encodeURIComponent('You are not assigned to one or more selected classes')}`);
      }
    }
  }

  const quiz = await dbCreateQuiz({
    createdByUserId: user.id,
    title: data.title,
    description: data.description,
    classIds: data.classIds,
  });

  revalidatePath('/teacher/quizzes');
  await redirectWithLocale(`/teacher/quizzes/${quiz.id}/edit`);
}

const updateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  classIds: z.array(z.string().uuid()).optional(),
});

async function teacherCanManageQuiz(quizId: string, teacherUserId: number): Promise<boolean> {
  const { getQuizById } = await import('@/lib/db/queries/quizzes');
  const quiz = await getQuizById(quizId);
  if (!quiz) return false;
  if (quiz.createdByUserId === teacherUserId) return true;
  const classIds = await getQuizClassIds(quizId);
  for (const classId of classIds) {
    if (await hasTeacherAssignment(classId, teacherUserId)) return true;
  }
  return false;
}

export async function updateQuizAction(
  quizId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const classIdsRaw = formData.getAll('classIds');
  const classIdsArr = Array.isArray(classIdsRaw) ? classIdsRaw.filter(Boolean) : [];
  const parsed = updateQuizSchema.safeParse({
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    classIds: classIdsArr.length ? classIdsArr : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation failed' };
  }

  if (user.platformRole === 'teacher') {
    const canManage = await teacherCanManageQuiz(quizId, user.id);
    if (!canManage) return { error: 'You cannot edit this quiz' };
  }

  const classIds = parsed.data.classIds?.filter(Boolean);
  const updateData: { title?: string; description?: string | null; classIds?: string[] } = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (classIds !== undefined) updateData.classIds = classIds;

  const updated = await dbUpdateQuiz(quizId, updateData);
  if (!updated) return { error: 'Quiz not found' };

  revalidatePath(`/teacher/quizzes/${quizId}/edit`);
  return {};
}

export async function updateQuizMetadataAction(
  quizId: string,
  data: { title?: string; description?: string | null }
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  if (user.platformRole === 'teacher') {
    const canManage = await teacherCanManageQuiz(quizId, user.id);
    if (!canManage) return { error: 'You cannot edit this quiz' };
  }
  const updated = await dbUpdateQuiz(quizId, data);
  if (!updated) return { error: 'Quiz not found' };
  revalidatePath(`/teacher/quizzes/${quizId}/edit`);
  return {};
}

export async function publishQuizAction(
  quizId: string
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  if (user.platformRole === 'teacher') {
    const canManage = await teacherCanManageQuiz(quizId, user.id);
    if (!canManage) return { error: 'You cannot publish this quiz' };
  }
  const updated = await dbPublishQuiz(quizId);
  if (!updated) return { error: 'Quiz not found' };
  const classIds = await getQuizClassIds(quizId);
  await createQuizFeedPosts(quizId, updated.title, updated.createdByUserId, classIds);
  for (const cid of classIds) {
    revalidatePath(`/classroom/${cid}`);
  }
  revalidatePath('/teacher/quizzes');
  revalidatePath(`/teacher/quizzes/${quizId}/edit`);
  return {};
}

const questionBaseSchema = z.object({
  type: z.enum(['MCQ', 'TRUE_FALSE', 'FILL_BLANK']),
  prompt: z.string().min(1, 'Question prompt is required'),
  explanation: z.string().optional(),
});

const mcqSchema = questionBaseSchema.extend({
  type: z.literal('MCQ'),
  choices: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.string(),
      })
    )
    .min(2)
    .max(5),
  correctAnswer: z.string().min(1),
});

const trueFalseSchema = questionBaseSchema.extend({
  type: z.literal('TRUE_FALSE'),
  choices: z.undefined().optional(),
  correctAnswer: z.boolean(),
});

const fillBlankSchema = questionBaseSchema.extend({
  type: z.literal('FILL_BLANK'),
  choices: z.undefined().optional(),
  correctAnswer: z.string().min(1),
});

const createQuestionSchema = z.discriminatedUnion('type', [
  mcqSchema,
  trueFalseSchema,
  fillBlankSchema,
]);

export async function addQuestionAction(
  quizId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const { getQuizById } = await import('@/lib/db/queries/quizzes');
  const quiz = await getQuizById(quizId);
  if (!quiz) return { error: 'Quiz not found' };

  if (user.platformRole === 'teacher') {
    const canManage = await teacherCanManageQuiz(quizId, user.id);
    if (!canManage) return { error: 'You cannot edit this quiz' };
  }

  const rawType = formData.get('type') as QuizQuestionType | null;
  const parsed = createQuestionSchema.safeParse({
    type: rawType,
    prompt: formData.get('prompt') || '',
    explanation: formData.get('explanation') || undefined,
    // choices and correctAnswer are parsed per type below
    choices:
      rawType === 'MCQ'
        ? JSON.parse((formData.get('choicesJson') as string) || '[]')
        : undefined,
    correctAnswer:
      rawType === 'TRUE_FALSE'
        ? formData.get('correctAnswer') === 'true'
        : formData.get('correctAnswer') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation failed' };
  }

  await dbAddQuestion({
    quizId,
    type: parsed.data.type,
    prompt: parsed.data.prompt,
    choices: 'choices' in parsed.data ? parsed.data.choices : undefined,
    correctAnswer: parsed.data.correctAnswer,
    explanation: parsed.data.explanation,
  });

  revalidatePath(`/teacher/quizzes/${quizId}/edit`);
  return {};
}

export async function addQuestionsBulkAction(
  quizId: string,
  questions: Array<{
    type: QuizQuestionType;
    prompt: string;
    choices?: { id: string; label: string; value: string }[] | null;
    correctAnswer: unknown;
    explanation?: string | null;
  }>
): Promise<{ error?: string; added?: number }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const { getQuizById } = await import('@/lib/db/queries/quizzes');
  const quiz = await getQuizById(quizId);
  if (!quiz) return { error: 'Quiz not found' };
  if (user.platformRole === 'teacher') {
    const canManage = await teacherCanManageQuiz(quizId, user.id);
    if (!canManage) return { error: 'You cannot edit this quiz' };
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: 'No questions to add.' };
  }
  if (questions.length > 15) {
    return { error: 'Maximum 15 questions per bulk add.' };
  }

  const payloads = questions.map((q) => ({
    quizId,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));

  await dbAddQuestionsBulk(quizId, payloads);
  revalidatePath(`/teacher/quizzes/${quizId}/edit`);
  revalidatePath('/teacher/quizzes');
  return { added: questions.length };
}

export async function updateQuestionAction(
  questionId: string,
  payload: {
    type: QuizQuestionType;
    prompt: string;
    choices?: unknown;
    correctAnswer: unknown;
    explanation?: string | null;
  }
): Promise<{ error?: string }> {
  await requireRole(['teacher', 'admin', 'school_admin']);
  await dbUpdateQuestion(questionId, payload);
  return {};
}

export async function addQuestionMcqAction(
  quizId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const quiz = await (await import('@/lib/db/queries/quizzes')).getQuizById(quizId);
  if (!quiz) return { error: 'Quiz not found' };
  if (user.platformRole === 'teacher') {
    const canManage = await teacherCanManageQuiz(quizId, user.id);
    if (!canManage) return { error: 'You cannot edit this quiz' };
  }
  const prompt = (formData.get('prompt') as string)?.trim();
  if (!prompt) return { error: 'Question prompt is required' };
  const labels = ['A', 'B', 'C', 'D'] as const;
  const values = ['a', 'b', 'c', 'd'] as const;
  const options = labels.map((label, i) => ({
    id: values[i],
    label: (formData.get(`option${label}`) as string)?.trim() || '',
    value: values[i],
  }));
  const filled = options.filter((o) => o.label.length > 0);
  if (filled.length < 2) return { error: 'At least 2 options required' };
  const correctIndex = Number(formData.get('correctIndex'));
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return { error: 'Select correct answer' };
  }
  const correctOption = options[correctIndex];
  if (!correctOption?.label) return { error: 'Correct option must have text' };
  await dbAddQuestion({
    quizId,
    type: 'MCQ',
    prompt,
    choices: filled,
    correctAnswer: correctOption.value,
  });
  revalidatePath(`/teacher/quizzes/${quizId}/edit`);
  return {};
}

export async function deleteQuestionAction(
  quizId: string,
  questionId: string
): Promise<void> {
  await requireRole(['teacher', 'admin', 'school_admin']);
  await dbDeleteQuestion(questionId);
  revalidatePath(`/teacher/quizzes/${quizId}/edit`);
}

export async function reorderQuestionsAction(
  quizId: string,
  orderedQuestionIds: string[]
): Promise<void> {
  await requireRole(['teacher', 'admin', 'school_admin']);
  await dbReorderQuestions(quizId, orderedQuestionIds);
  revalidatePath(`/teacher/quizzes/${quizId}/edit`);
}

type StudentAnswer = {
  questionId: string;
  type: QuizQuestionType;
  value: unknown;
};

export async function getQuizForStudentAction(quizId: string) {
  const user = await getUser();
  if (!user || user.platformRole !== 'student') {
    const { getLocale } = await import('next-intl/server');
    const locale = await getLocale();
    redirect(`/${locale}/dashboard`);
  }

  const result = await dbGetQuizForStudent(quizId, user.id);
  if (!result) {
    return null;
  }

  return result;
}

/** For teachers/admins viewing a student's quiz attempt (read-only). */
export async function getQuizSubmissionForViewerAction(
  quizId: string,
  studentUserId: number
) {
  const user = await getUser();
  if (!user) return { error: 'Not signed in' };

  const role = user.platformRole as string | null;
  if (role === 'admin') {
    // Admin can view all
  } else if (role === 'school_admin') {
    const { hasStudentEnrollment } = await import('@/lib/db/queries/education');
    if (!(await hasStudentEnrollment(studentUserId, user.id))) {
      return { error: 'Student not found' };
    }
  } else if (role === 'teacher') {
    const { isStudentInTeacherClass } = await import('@/lib/db/queries/education');
    if (!(await isStudentInTeacherClass(user.id, studentUserId))) {
      return { error: 'You can only view students in your classes' };
    }
  } else {
    return { error: 'Not authorized' };
  }

  const result = await dbGetQuizForStudent(quizId, studentUserId);
  if (!result) return { error: 'Quiz or submission not found' };
  if (!result.submission) return { error: 'Student has not taken this quiz' };

  return { quiz: result.quiz, submission: result.submission, studentUserId };
}

export async function submitQuizAction(params: {
  quizId: string;
  answers: StudentAnswer[];
}): Promise<{ error?: string; score?: number }> {
  const user = await getUser();
  if (!user || user.platformRole !== 'student') {
    return { error: 'Not authorized' };
  }

  const result = await dbGetQuizForStudent(params.quizId, user.id);
  if (!result) {
    return { error: 'Quiz not found' };
  }

  const { quiz } = result;
  const questionsById = new Map(
    quiz.questions.map((q) => [q.id, q])
  );

  let correctCount = 0;

  for (const answer of params.answers) {
    const question = questionsById.get(answer.questionId);
    if (!question) continue;

    const userValue = answer.value;
    const correct = question.correctAnswer;

    if (question.type === 'MCQ') {
      if (typeof userValue === 'string' && typeof correct === 'string') {
        if (userValue === correct) correctCount++;
      }
    } else if (question.type === 'TRUE_FALSE') {
      if (typeof userValue === 'boolean' && typeof correct === 'boolean') {
        if (userValue === correct) correctCount++;
      }
    } else if (question.type === 'FILL_BLANK') {
      if (typeof userValue === 'string' && typeof correct === 'string') {
        if (userValue.trim().toLowerCase() === correct.trim().toLowerCase()) {
          correctCount++;
        }
      }
    }
  }

  const totalQuestions = quiz.questions.length || 1;
  const score = Math.round((correctCount / totalQuestions) * 100);

  await dbCreateQuizSubmission({
    quizId: params.quizId,
    studentUserId: user.id,
    score,
    answers: params.answers,
  });

  revalidatePath(`/learning/${params.quizId}`);

  return { score };
}

export async function getTeacherQuizResultsAction(quizId: string) {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const data = await dbGetTeacherQuizResults(quizId);
  if (!data) {
    await redirectWithLocale('/dashboard');
  }

  if (user.platformRole === 'teacher') {
    const canManage = await teacherCanManageQuiz(quizId, user.id);
    if (!canManage) await redirectWithLocale('/dashboard');
  }

  return data as NonNullable<typeof data>;
}

export async function getAdminOverviewAction() {
  const user = await requireRole(['admin', 'school_admin']);
  if (!user) {
    await redirectWithLocale('/sign-in');
  }
  return dbGetAdminOverview();
}

