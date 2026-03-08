import {
  and,
  avg,
  count,
  eq,
  inArray,
  isNotNull,
  sql,
} from 'drizzle-orm';
import { db } from '../drizzle';
import {
  eduClasses,
  eduEnrollments,
  eduQuizClasses,
  eduQuizzes,
  eduQuizQuestions,
  eduQuizSubmissions,
  users,
  type EduQuiz,
  type EduQuizQuestion,
  type EduQuizSubmission,
} from '../schema';

export type CreateQuizData = {
  createdByUserId: number;
  title: string;
  description?: string | null;
  classIds: string[];
};

export type UpdateQuizData = Partial<
  Pick<CreateQuizData, 'title' | 'description' | 'classIds'>
>;

export type CreateQuestionData = {
  quizId: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK';
  prompt: string;
  choices?: unknown | null;
  correctAnswer: unknown;
  explanation?: string | null;
};

export type UpdateQuestionData = Partial<Omit<CreateQuestionData, 'quizId'>>;

export type QuizWithQuestions = EduQuiz & {
  questions: EduQuizQuestion[];
};

export async function createQuiz(data: CreateQuizData): Promise<EduQuiz> {
  const [created] = await db
    .insert(eduQuizzes)
    .values({
      createdByUserId: data.createdByUserId,
      title: data.title,
      description: data.description ?? null,
      status: 'DRAFT',
      updatedAt: new Date(),
    })
    .returning();
  if (data.classIds.length > 0) {
    await db.insert(eduQuizClasses).values(
      data.classIds.map((classId) => ({
        quizId: created.id,
        classId,
      }))
    );
  }
  return created;
}

export async function updateQuiz(
  quizId: string,
  data: UpdateQuizData
): Promise<EduQuiz | null> {
  const { classIds, ...rest } = data;
  const quizData: { title?: string; description?: string | null; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (rest.title !== undefined) quizData.title = rest.title;
  if (rest.description !== undefined) quizData.description = rest.description;
  const [updated] = await db
    .update(eduQuizzes)
    .set(quizData)
    .where(eq(eduQuizzes.id, quizId))
    .returning();
  if (!updated) return null;
  if (classIds !== undefined) {
    await db.delete(eduQuizClasses).where(eq(eduQuizClasses.quizId, quizId));
    if (classIds.length > 0) {
      await db.insert(eduQuizClasses).values(
        classIds.map((classId) => ({ quizId, classId }))
      );
    }
  }
  return updated;
}

export async function deleteQuiz(quizId: string): Promise<boolean> {
  const result = await db
    .delete(eduQuizzes)
    .where(eq(eduQuizzes.id, quizId))
    .returning({ id: eduQuizzes.id });
  return result.length > 0;
}

export async function getQuizById(quizId: string): Promise<EduQuiz | null> {
  const [row] = await db
    .select()
    .from(eduQuizzes)
    .where(eq(eduQuizzes.id, quizId))
    .limit(1);
  return row ?? null;
}

export async function getQuizClassIds(quizId: string): Promise<string[]> {
  const rows = await db
    .select({ classId: eduQuizClasses.classId })
    .from(eduQuizClasses)
    .where(eq(eduQuizClasses.quizId, quizId));
  return rows.map((r) => r.classId);
}

export async function publishQuiz(quizId: string): Promise<EduQuiz | null> {
  const now = new Date();
  const [updated] = await db
    .update(eduQuizzes)
    .set({
      status: 'PUBLISHED',
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(eduQuizzes.id, quizId))
    .returning();
  return updated ?? null;
}

export async function addQuestionsBulk(
  quizId: string,
  questions: CreateQuestionData[]
): Promise<EduQuizQuestion[]> {
  const created: EduQuizQuestion[] = [];
  let nextOrder = 0;
  const [maxRow] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${eduQuizQuestions.order}), 0)` })
    .from(eduQuizQuestions)
    .where(eq(eduQuizQuestions.quizId, quizId));
  nextOrder = (maxRow?.maxOrder ?? 0) + 1;

  for (const data of questions) {
    const [row] = await db
      .insert(eduQuizQuestions)
      .values({
        quizId,
        type: data.type,
        prompt: data.prompt,
        choices: data.choices ?? null,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation ?? null,
        order: nextOrder++,
      })
      .returning();
    if (row) created.push(row);
  }
  return created;
}

export async function addQuestion(
  data: CreateQuestionData
): Promise<EduQuizQuestion> {
  const [maxOrder] = await db
    .select({
      maxOrder: sql<number>`coalesce(max(${eduQuizQuestions.order}), 0)`,
    })
    .from(eduQuizQuestions)
    .where(eq(eduQuizQuestions.quizId, data.quizId));

  const nextOrder = (maxOrder?.maxOrder ?? 0) + 1;

  const [created] = await db
    .insert(eduQuizQuestions)
    .values({
      quizId: data.quizId,
      type: data.type,
      prompt: data.prompt,
      choices: data.choices ?? null,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation ?? null,
      order: nextOrder,
    })
    .returning();
  return created;
}

export async function updateQuestion(
  questionId: string,
  data: UpdateQuestionData
): Promise<EduQuizQuestion | null> {
  const [updated] = await db
    .update(eduQuizQuestions)
    .set({
      ...data,
    })
    .where(eq(eduQuizQuestions.id, questionId))
    .returning();
  return updated ?? null;
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await db.delete(eduQuizQuestions).where(eq(eduQuizQuestions.id, questionId));
}

export async function reorderQuestions(
  quizId: string,
  orderedQuestionIds: string[]
): Promise<void> {
  const updates = orderedQuestionIds.map((id, index) =>
    db
      .update(eduQuizQuestions)
      .set({ order: index + 1 })
      .where(and(eq(eduQuizQuestions.id, id), eq(eduQuizQuestions.quizId, quizId)))
  );
  await Promise.all(updates);
}

export async function getQuizWithQuestions(
  quizId: string
): Promise<QuizWithQuestions | null> {
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;
  const questions = await db
    .select()
    .from(eduQuizQuestions)
    .where(eq(eduQuizQuestions.quizId, quizId))
    .orderBy(sql`${eduQuizQuestions.order} ASC`);
  return { ...quiz, questions };
}

export async function getQuizzesForStudentClasses(
  studentUserId: number
) {
  const rows = await db
    .select({
      quiz: eduQuizzes,
      className: eduClasses.name,
      submission: eduQuizSubmissions,
    })
    .from(eduQuizzes)
    .innerJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizzes.id))
    .innerJoin(eduClasses, eq(eduQuizClasses.classId, eduClasses.id))
    .innerJoin(
      eduEnrollments,
      and(
        eq(eduEnrollments.classId, eduQuizClasses.classId),
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active')
      )
    )
    .leftJoin(
      eduQuizSubmissions,
      and(
        eq(eduQuizSubmissions.quizId, eduQuizzes.id),
        eq(eduQuizSubmissions.studentUserId, studentUserId)
      )
    )
    .where(eq(eduQuizzes.status, 'PUBLISHED'))
    .orderBy(sql`${eduQuizzes.publishedAt} DESC`);
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.quiz.id)) return false;
    seen.add(r.quiz.id);
    return true;
  });
}

export async function getQuizForStudent(
  quizId: string,
  studentUserId: number
) {
  const quiz = await getQuizWithQuestions(quizId);
  if (!quiz) return null;

  const [enrolled] = await db
    .select()
    .from(eduEnrollments)
    .innerJoin(eduQuizClasses, and(
      eq(eduQuizClasses.quizId, quizId),
      eq(eduQuizClasses.classId, eduEnrollments.classId)
    ))
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active')
      )
    )
    .limit(1);

  if (!enrolled) return null;

  const [submission] = await db
    .select()
    .from(eduQuizSubmissions)
    .where(
      and(
        eq(eduQuizSubmissions.quizId, quizId),
        eq(eduQuizSubmissions.studentUserId, studentUserId)
      )
    )
    .limit(1);

  return {
    quiz,
    submission: submission ?? null,
  };
}

export async function createQuizSubmission(data: {
  quizId: string;
  studentUserId: number;
  score: number;
  answers: unknown;
  attemptNumber?: number;
}): Promise<EduQuizSubmission> {
  const [existing] = await db
    .select()
    .from(eduQuizSubmissions)
    .where(
      and(
        eq(eduQuizSubmissions.quizId, data.quizId),
        eq(eduQuizSubmissions.studentUserId, data.studentUserId)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(eduQuizSubmissions)
      .set({
        score: data.score,
        answers: data.answers,
        attemptNumber: (existing.attemptNumber ?? 1) + 1,
        submittedAt: new Date(),
      })
      .where(eq(eduQuizSubmissions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(eduQuizSubmissions)
    .values({
      quizId: data.quizId,
      studentUserId: data.studentUserId,
      score: data.score,
      answers: data.answers,
      attemptNumber: data.attemptNumber ?? 1,
    })
    .returning();
  return created;
}

export async function listTeacherQuizzesForUser(
  teacherUserId: number
) {
  const rows = await db
    .select({
      quiz: eduQuizzes,
      className: eduClasses.name,
    })
    .from(eduQuizzes)
    .leftJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizzes.id))
    .leftJoin(eduClasses, eq(eduQuizClasses.classId, eduClasses.id))
    .where(eq(eduQuizzes.createdByUserId, teacherUserId))
    .orderBy(sql`${eduQuizzes.createdAt} DESC`);

  const byQuiz = new Map<string, { quiz: typeof eduQuizzes.$inferSelect; classNames: string[] }>();
  for (const r of rows) {
    if (!byQuiz.has(r.quiz.id)) {
      byQuiz.set(r.quiz.id, { quiz: r.quiz, classNames: [] });
    }
    if (r.className) byQuiz.get(r.quiz.id)!.classNames.push(r.className);
  }
  return Array.from(byQuiz.values()).map(({ quiz, classNames }) => ({
    quiz,
    className: classNames.length ? classNames.join(', ') : 'No classes assigned',
  }));
}

export type StudentQuizResultRow = {
  submissionId: string;
  quizId: string;
  quizTitle: string;
  className: string;
  score: number;
  submittedAt: Date;
};

export type StudentAssessmentsProfile = {
  averageScore: number | null;
  quizzesTaken: number;
  lastQuiz: { title: string; score: number } | null;
  results: StudentQuizResultRow[];
};

/** Quiz results for student profile (last 5, avg, etc). Used by teachers, admins, and students (own). */
export async function getQuizResultsForStudentProfile(
  studentUserId: number
): Promise<StudentAssessmentsProfile> {
  const allSubmissions = await db
    .select({
      submissionId: eduQuizSubmissions.id,
      quizId: eduQuizSubmissions.quizId,
      score: eduQuizSubmissions.score,
      submittedAt: eduQuizSubmissions.submittedAt,
      quizTitle: eduQuizzes.title,
      className: eduClasses.name,
    })
    .from(eduQuizSubmissions)
    .innerJoin(eduQuizzes, eq(eduQuizSubmissions.quizId, eduQuizzes.id))
    .leftJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizzes.id))
    .leftJoin(eduClasses, eq(eduClasses.id, eduQuizClasses.classId))
    .where(eq(eduQuizSubmissions.studentUserId, studentUserId))
    .orderBy(sql`${eduQuizSubmissions.submittedAt} DESC`);

  const seen = new Set<string>();
  const results: StudentQuizResultRow[] = [];
  for (const r of allSubmissions) {
    if (seen.has(r.submissionId)) continue;
    seen.add(r.submissionId);
    results.push({
      submissionId: r.submissionId,
      quizId: r.quizId,
      quizTitle: r.quizTitle,
      className: r.className ?? '—',
      score: r.score,
      submittedAt: r.submittedAt,
    });
    if (results.length >= 5) break;
  }

  const totalFromAll = await db
    .select({
      count: count(eduQuizSubmissions.id),
      avgScore: avg(eduQuizSubmissions.score),
    })
    .from(eduQuizSubmissions)
    .where(eq(eduQuizSubmissions.studentUserId, studentUserId));

  const quizzesTaken = Number(totalFromAll[0]?.count ?? 0);
  const rawAvg = totalFromAll[0]?.avgScore;
  const averageScore =
    quizzesTaken > 0 && rawAvg != null ? Math.round(Number(rawAvg)) : null;

  const lastQuiz =
    results.length > 0
      ? { title: results[0]!.quizTitle, score: results[0]!.score }
      : null;

  return {
    averageScore,
    quizzesTaken,
    lastQuiz,
    results,
  };
}

export async function getTeacherQuizResults(quizId: string) {
  const [quiz] = await db
    .select()
    .from(eduQuizzes)
    .where(eq(eduQuizzes.id, quizId))
    .limit(1);
  if (!quiz) return null;

  const submissions = await db
    .select({
      submission: eduQuizSubmissions,
      student: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(eduQuizSubmissions)
    .innerJoin(users, eq(eduQuizSubmissions.studentUserId, users.id))
    .where(eq(eduQuizSubmissions.quizId, quizId))
    .orderBy(sql`${eduQuizSubmissions.submittedAt} DESC`);

  return {
    quiz,
    submissions,
  };
}

export async function getAdminOverview() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [summary] = await db
    .select({
      quizzesLast30d: count(eduQuizzes.id).as('quizzesLast30d'),
    })
    .from(eduQuizzes)
    .where(
      and(
        eq(eduQuizzes.status, 'PUBLISHED'),
        isNotNull(eduQuizzes.publishedAt),
        sql`${eduQuizzes.publishedAt} >= ${thirtyDaysAgo}`
      )
    );

  const [scores] = await db
    .select({
      avgScore: avg(eduQuizSubmissions.score).as('avgScore'),
      completedCount: count(eduQuizSubmissions.id).as('completedCount'),
    })
    .from(eduQuizSubmissions);

  // Approximate completion rate: submissions / active enrollments
  const [activeEnrollments] = await db
    .select({
      activeCount: count(eduEnrollments.id).as('activeCount'),
    })
    .from(eduEnrollments)
    .where(eq(eduEnrollments.status, 'active'));

  const completionRate =
    activeEnrollments.activeCount && activeEnrollments.activeCount > 0
      ? Number(
          ((Number(scores.completedCount ?? 0) /
            Number(activeEnrollments.activeCount)) *
            100
          ).toFixed(1)
        )
      : 0;

  const recentRows = await db
    .select({
      quiz: eduQuizzes,
      className: eduClasses.name,
    })
    .from(eduQuizzes)
    .leftJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizzes.id))
    .leftJoin(eduClasses, eq(eduQuizClasses.classId, eduClasses.id))
    .where(
      and(
        eq(eduQuizzes.status, 'PUBLISHED'),
        isNotNull(eduQuizzes.publishedAt),
        sql`${eduQuizzes.publishedAt} >= ${thirtyDaysAgo}`
      )
    )
    .orderBy(sql`${eduQuizzes.publishedAt} DESC`)
    .limit(50);
  const seen = new Set<string>();
  const recentQuizzes = recentRows
    .filter((r) => {
      if (seen.has(r.quiz.id)) return false;
      seen.add(r.quiz.id);
      return true;
    })
    .slice(0, 10)
    .map((r) => ({ quiz: r.quiz, className: r.className ?? 'No classes' }));

  return {
    quizzesLast30d: Number(summary.quizzesLast30d ?? 0),
    avgScore: scores.avgScore != null ? Number(Number(scores.avgScore).toFixed(1)) : null,
    completionRate,
    recentQuizzes,
  };
}

