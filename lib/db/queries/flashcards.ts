import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../drizzle';
import {
  eduClassTeachers,
  eduClasses,
  eduEnrollments,
  eduQuizSubmissions,
  flashcardCards,
  flashcardDecks,
  flashcardSaves,
  flashcardStudyEvents,
  type FlashcardStudyResult,
  type PlatformRole,
} from '../schema';
import { getQuizzesForStudentClasses } from './quizzes';

export type MonthRange = { start: Date; end: Date };

export type ManagedFlashcardClass = {
  id: string;
  name: string;
};

export type ManagerFlashcardDeck = {
  id: string;
  title: string;
  description: string | null;
  scope: 'class' | 'global';
  classId: string | null;
  className: string | null;
  isPublished: boolean;
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
  cardCount: number;
};

export type FlashcardDeckCard = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  example: string | null;
  sortOrder: number;
  createdAt: Date;
};

export type FlashcardDeckWithCards = {
  deck: {
    id: string;
    title: string;
    description: string | null;
    scope: 'class' | 'global';
    classId: string | null;
    className: string | null;
    isPublished: boolean;
    createdByUserId: number;
    createdAt: Date;
    updatedAt: Date;
  };
  cards: FlashcardDeckCard[];
};

export type StudentAssignedFlashcardDeck = {
  id: string;
  title: string;
  description: string | null;
  scope: 'class' | 'global';
  classId: string | null;
  className: string | null;
  cardCount: number;
  isPublished: boolean;
  updatedAt: Date;
};

export type SavedFlashcardCard = {
  saveId: string;
  savedAt: Date;
  cardId: string;
  deckId: string;
  deckTitle: string;
  front: string;
  back: string;
  example: string | null;
};

export type StudentLearningOverview = {
  monthRange: MonthRange;
  quizStats: {
    assignedCount: number;
    completedCount: number;
    completionRate: number;
    averageScoreThisMonth: number | null;
    lastQuizScore: number | null;
  };
  flashcardsStudiedThisMonth: number;
  flashcardAccuracyThisMonth: number | null;
  savedWordsCount: number;
  assignedDecks: Array<{
    id: string;
    title: string;
    cardCount: number;
    lastStudiedAt: Date | null;
    accuracyThisMonth: number | null;
  }>;
};

function toAccuracy(correct: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((correct / total) * 100);
}

export function getThisMonthRange(baseDate = new Date()): MonthRange {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  return { start, end };
}

export function getMonthRangeFromKey(monthKey: string): MonthRange | null {
  const matched = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!matched) return null;
  const year = Number(matched[1]);
  const monthIndex = Number(matched[2]) - 1;
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) return null;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  return { start, end };
}

export async function listManageableFlashcardClasses(
  userId: number,
  platformRole: PlatformRole
): Promise<ManagedFlashcardClass[]> {
  if (platformRole === 'teacher') {
    const rows = await db
      .select({
        id: eduClasses.id,
        name: eduClasses.name,
      })
      .from(eduClassTeachers)
      .innerJoin(eduClasses, eq(eduClassTeachers.classId, eduClasses.id))
      .where(eq(eduClassTeachers.teacherUserId, userId))
      .orderBy(asc(eduClasses.name));
    return rows;
  }

  if (platformRole === 'admin' || platformRole === 'school_admin') {
    return db
      .select({
        id: eduClasses.id,
        name: eduClasses.name,
      })
      .from(eduClasses)
      .orderBy(asc(eduClasses.name));
  }

  return [];
}

export async function createFlashcardDeck(data: {
  title: string;
  description?: string | null;
  createdByUserId: number;
  scope: 'class' | 'global';
  classId?: string | null;
}) {
  const [created] = await db
    .insert(flashcardDecks)
    .values({
      title: data.title,
      description: data.description ?? null,
      createdByUserId: data.createdByUserId,
      scope: data.scope,
      classId: data.scope === 'class' ? data.classId ?? null : null,
      isPublished: false,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateFlashcardDeck(
  deckId: string,
  data: {
    title?: string;
    description?: string | null;
    scope?: 'class' | 'global';
    classId?: string | null;
    isPublished?: boolean;
  }
) {
  const [updated] = await db
    .update(flashcardDecks)
    .set({
      title: data.title,
      description: data.description,
      scope: data.scope,
      classId: data.scope === 'global' ? null : data.classId,
      isPublished: data.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(flashcardDecks.id, deckId))
    .returning();
  return updated ?? null;
}

export async function setFlashcardDeckPublished(deckId: string, isPublished: boolean) {
  const [updated] = await db
    .update(flashcardDecks)
    .set({
      isPublished,
      updatedAt: new Date(),
    })
    .where(eq(flashcardDecks.id, deckId))
    .returning();
  return updated ?? null;
}

export async function getFlashcardDeckById(deckId: string) {
  const [row] = await db
    .select()
    .from(flashcardDecks)
    .where(eq(flashcardDecks.id, deckId))
    .limit(1);
  return row ?? null;
}

export async function listFlashcardDecksForManager(
  userId: number,
  platformRole: PlatformRole
): Promise<ManagerFlashcardDeck[]> {
  if (
    platformRole !== 'teacher' &&
    platformRole !== 'admin' &&
    platformRole !== 'school_admin'
  ) {
    return [];
  }

  const deckRows =
    platformRole === 'teacher'
      ? await db
          .select({
            deck: flashcardDecks,
            className: eduClasses.name,
          })
          .from(flashcardDecks)
          .leftJoin(eduClasses, eq(flashcardDecks.classId, eduClasses.id))
          .where(eq(flashcardDecks.createdByUserId, userId))
          .orderBy(desc(flashcardDecks.updatedAt))
      : await db
          .select({
            deck: flashcardDecks,
            className: eduClasses.name,
          })
          .from(flashcardDecks)
          .leftJoin(eduClasses, eq(flashcardDecks.classId, eduClasses.id))
          .orderBy(desc(flashcardDecks.updatedAt));

  const deckIds = deckRows.map((row) => row.deck.id);
  const cardCounts =
    deckIds.length === 0
      ? []
      : await db
          .select({
            deckId: flashcardCards.deckId,
            cardCount: sql<number>`count(*)::int`,
          })
          .from(flashcardCards)
          .where(inArray(flashcardCards.deckId, deckIds))
          .groupBy(flashcardCards.deckId);

  const countByDeckId = new Map(cardCounts.map((row) => [row.deckId, row.cardCount]));
  return deckRows.map((row) => ({
    id: row.deck.id,
    title: row.deck.title,
    description: row.deck.description,
    scope: row.deck.scope,
    classId: row.deck.classId,
    className: row.className ?? null,
    isPublished: row.deck.isPublished,
    createdByUserId: row.deck.createdByUserId,
    createdAt: row.deck.createdAt,
    updatedAt: row.deck.updatedAt,
    cardCount: countByDeckId.get(row.deck.id) ?? 0,
  }));
}

export async function teacherCanManageFlashcardDeck(
  deckId: string,
  teacherUserId: number
): Promise<boolean> {
  const [row] = await db
    .select({
      createdByUserId: flashcardDecks.createdByUserId,
      classId: flashcardDecks.classId,
    })
    .from(flashcardDecks)
    .where(eq(flashcardDecks.id, deckId))
    .limit(1);

  if (!row) return false;
  if (row.createdByUserId === teacherUserId) return true;
  if (!row.classId) return false;

  const [assignment] = await db
    .select({ classId: eduClassTeachers.classId })
    .from(eduClassTeachers)
    .where(
      and(
        eq(eduClassTeachers.classId, row.classId),
        eq(eduClassTeachers.teacherUserId, teacherUserId)
      )
    )
    .limit(1);
  return !!assignment;
}

export async function createFlashcardCard(data: {
  deckId: string;
  front: string;
  back: string;
  example?: string | null;
}) {
  const [maxOrderRow] = await db
    .select({
      maxOrder: sql<number>`coalesce(max(${flashcardCards.sortOrder}), 0)::int`,
    })
    .from(flashcardCards)
    .where(eq(flashcardCards.deckId, data.deckId));

  const [created] = await db
    .insert(flashcardCards)
    .values({
      deckId: data.deckId,
      front: data.front,
      back: data.back,
      example: data.example ?? null,
      sortOrder: (maxOrderRow?.maxOrder ?? 0) + 1,
    })
    .returning();

  await db
    .update(flashcardDecks)
    .set({ updatedAt: new Date() })
    .where(eq(flashcardDecks.id, data.deckId));

  return created;
}

export async function updateFlashcardCard(
  cardId: string,
  data: {
    front?: string;
    back?: string;
    example?: string | null;
    sortOrder?: number;
  }
) {
  const [updated] = await db
    .update(flashcardCards)
    .set({
      front: data.front,
      back: data.back,
      example: data.example,
      sortOrder: data.sortOrder,
    })
    .where(eq(flashcardCards.id, cardId))
    .returning();

  if (updated) {
    await db
      .update(flashcardDecks)
      .set({ updatedAt: new Date() })
      .where(eq(flashcardDecks.id, updated.deckId));
  }

  return updated ?? null;
}

export async function deleteFlashcardCard(cardId: string) {
  const [deleted] = await db
    .delete(flashcardCards)
    .where(eq(flashcardCards.id, cardId))
    .returning();

  if (deleted) {
    await db
      .update(flashcardDecks)
      .set({ updatedAt: new Date() })
      .where(eq(flashcardDecks.id, deleted.deckId));
  }

  return deleted ?? null;
}

export async function getFlashcardDeckWithCards(
  deckId: string
): Promise<FlashcardDeckWithCards | null> {
  const [deckRow] = await db
    .select({
      deck: flashcardDecks,
      className: eduClasses.name,
    })
    .from(flashcardDecks)
    .leftJoin(eduClasses, eq(flashcardDecks.classId, eduClasses.id))
    .where(eq(flashcardDecks.id, deckId))
    .limit(1);

  if (!deckRow) return null;

  const cards = await db
    .select({
      id: flashcardCards.id,
      deckId: flashcardCards.deckId,
      front: flashcardCards.front,
      back: flashcardCards.back,
      example: flashcardCards.example,
      sortOrder: flashcardCards.sortOrder,
      createdAt: flashcardCards.createdAt,
    })
    .from(flashcardCards)
    .where(eq(flashcardCards.deckId, deckId))
    .orderBy(asc(flashcardCards.sortOrder), asc(flashcardCards.createdAt));

  return {
    deck: {
      id: deckRow.deck.id,
      title: deckRow.deck.title,
      description: deckRow.deck.description,
      scope: deckRow.deck.scope,
      classId: deckRow.deck.classId,
      className: deckRow.className ?? null,
      isPublished: deckRow.deck.isPublished,
      createdByUserId: deckRow.deck.createdByUserId,
      createdAt: deckRow.deck.createdAt,
      updatedAt: deckRow.deck.updatedAt,
    },
    cards,
  };
}

export async function getAssignedFlashcardDecksForStudent(
  studentUserId: number,
  classId?: string | null
): Promise<StudentAssignedFlashcardDeck[]> {
  const enrollmentWhere = [
    eq(eduEnrollments.studentUserId, studentUserId),
    eq(eduEnrollments.status, 'active'),
  ];
  if (classId) {
    enrollmentWhere.push(eq(eduEnrollments.classId, classId));
  }

  const enrollments = await db
    .select({ classId: eduEnrollments.classId })
    .from(eduEnrollments)
    .where(and(...enrollmentWhere));

  const classIds = enrollments.map((row) => row.classId);
  const visibilityClause =
    classIds.length > 0
      ? or(
          eq(flashcardDecks.scope, 'global'),
          and(eq(flashcardDecks.scope, 'class'), inArray(flashcardDecks.classId, classIds))
        )
      : eq(flashcardDecks.scope, 'global');

  const deckRows = await db
    .select({
      deck: flashcardDecks,
      className: eduClasses.name,
    })
    .from(flashcardDecks)
    .leftJoin(eduClasses, eq(flashcardDecks.classId, eduClasses.id))
    .where(and(eq(flashcardDecks.isPublished, true), visibilityClause))
    .orderBy(desc(flashcardDecks.updatedAt));

  const deckIds = deckRows.map((row) => row.deck.id);
  const cardCounts =
    deckIds.length === 0
      ? []
      : await db
          .select({
            deckId: flashcardCards.deckId,
            cardCount: sql<number>`count(*)::int`,
          })
          .from(flashcardCards)
          .where(inArray(flashcardCards.deckId, deckIds))
          .groupBy(flashcardCards.deckId);

  const countByDeckId = new Map(cardCounts.map((row) => [row.deckId, row.cardCount]));
  return deckRows.map((row) => ({
    id: row.deck.id,
    title: row.deck.title,
    description: row.deck.description,
    scope: row.deck.scope,
    classId: row.deck.classId,
    className: row.className ?? null,
    cardCount: countByDeckId.get(row.deck.id) ?? 0,
    isPublished: row.deck.isPublished,
    updatedAt: row.deck.updatedAt,
  }));
}

export async function isFlashcardDeckVisibleToStudent(
  studentUserId: number,
  deckId: string
): Promise<boolean> {
  const [deck] = await db
    .select({
      id: flashcardDecks.id,
      scope: flashcardDecks.scope,
      classId: flashcardDecks.classId,
      isPublished: flashcardDecks.isPublished,
    })
    .from(flashcardDecks)
    .where(eq(flashcardDecks.id, deckId))
    .limit(1);

  if (!deck || !deck.isPublished) return false;
  if (deck.scope === 'global') return true;
  if (!deck.classId) return false;

  const [enrollment] = await db
    .select({ classId: eduEnrollments.classId })
    .from(eduEnrollments)
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active'),
        eq(eduEnrollments.classId, deck.classId)
      )
    )
    .limit(1);
  return !!enrollment;
}

export async function getFlashcardCardById(cardId: string) {
  const [row] = await db
    .select()
    .from(flashcardCards)
    .where(eq(flashcardCards.id, cardId))
    .limit(1);
  return row ?? null;
}

export async function saveFlashcardForStudent(studentUserId: number, cardId: string) {
  const [saved] = await db
    .insert(flashcardSaves)
    .values({
      studentUserId,
      cardId,
    })
    .onConflictDoNothing()
    .returning();

  if (saved) return saved;

  const [existing] = await db
    .select()
    .from(flashcardSaves)
    .where(
      and(
        eq(flashcardSaves.studentUserId, studentUserId),
        eq(flashcardSaves.cardId, cardId)
      )
    )
    .limit(1);
  return existing ?? null;
}

export async function removeFlashcardSaveForStudent(studentUserId: number, cardId: string) {
  const [deleted] = await db
    .delete(flashcardSaves)
    .where(
      and(
        eq(flashcardSaves.studentUserId, studentUserId),
        eq(flashcardSaves.cardId, cardId)
      )
    )
    .returning();
  return deleted ?? null;
}

export async function isFlashcardSavedByStudent(studentUserId: number, cardId: string) {
  const [row] = await db
    .select({ id: flashcardSaves.id })
    .from(flashcardSaves)
    .where(
      and(
        eq(flashcardSaves.studentUserId, studentUserId),
        eq(flashcardSaves.cardId, cardId)
      )
    )
    .limit(1);
  return !!row;
}

export async function listSavedFlashcardsForStudent(
  studentUserId: number
): Promise<SavedFlashcardCard[]> {
  const rows = await db
    .select({
      saveId: flashcardSaves.id,
      savedAt: flashcardSaves.createdAt,
      cardId: flashcardCards.id,
      deckId: flashcardDecks.id,
      deckTitle: flashcardDecks.title,
      front: flashcardCards.front,
      back: flashcardCards.back,
      example: flashcardCards.example,
    })
    .from(flashcardSaves)
    .innerJoin(flashcardCards, eq(flashcardSaves.cardId, flashcardCards.id))
    .innerJoin(flashcardDecks, eq(flashcardCards.deckId, flashcardDecks.id))
    .where(eq(flashcardSaves.studentUserId, studentUserId))
    .orderBy(desc(flashcardSaves.createdAt));

  return rows;
}

export async function getSavedWordCount(studentUserId: number): Promise<number> {
  const [row] = await db
    .select({ total: count(flashcardSaves.id) })
    .from(flashcardSaves)
    .where(eq(flashcardSaves.studentUserId, studentUserId));
  return Number(row?.total ?? 0);
}

export async function recordFlashcardStudyEvent(data: {
  studentUserId: number;
  deckId: string;
  cardId: string;
  result: FlashcardStudyResult;
}) {
  const [created] = await db
    .insert(flashcardStudyEvents)
    .values({
      studentUserId: data.studentUserId,
      deckId: data.deckId,
      cardId: data.cardId,
      result: data.result,
    })
    .returning();
  return created;
}

export async function getStudentLearningOverview(
  studentUserId: number,
  options?: { classId?: string | null; monthRange?: MonthRange }
): Promise<StudentLearningOverview> {
  const monthRange = options?.monthRange ?? getThisMonthRange();
  const { start, end } = monthRange;

  const [assignedDecks, quizzes, flashcardAggregate, savedWordsCount, quizAggregate, lastQuiz] =
    await Promise.all([
      getAssignedFlashcardDecksForStudent(studentUserId, options?.classId ?? null),
      getQuizzesForStudentClasses(studentUserId),
      db
        .select({
          total: count(flashcardStudyEvents.id),
          correct: sql<number>`coalesce(sum(case when ${flashcardStudyEvents.result} = 'correct' then 1 else 0 end), 0)::int`,
        })
        .from(flashcardStudyEvents)
        .where(
          and(
            eq(flashcardStudyEvents.studentUserId, studentUserId),
            gte(flashcardStudyEvents.studiedAt, start),
            lt(flashcardStudyEvents.studiedAt, end)
          )
        )
        .then((rows) => rows[0]),
      getSavedWordCount(studentUserId),
      db
        .select({
          avgScore: sql<number | null>`avg(${eduQuizSubmissions.score})`,
        })
        .from(eduQuizSubmissions)
        .where(
          and(
            eq(eduQuizSubmissions.studentUserId, studentUserId),
            gte(eduQuizSubmissions.submittedAt, start),
            lt(eduQuizSubmissions.submittedAt, end)
          )
        )
        .then((rows) => rows[0]),
      db
        .select({ score: eduQuizSubmissions.score })
        .from(eduQuizSubmissions)
        .where(eq(eduQuizSubmissions.studentUserId, studentUserId))
        .orderBy(desc(eduQuizSubmissions.submittedAt))
        .limit(1)
        .then((rows) => rows[0]),
    ]);

  const deckIds = assignedDecks.map((deck) => deck.id);
  const deckEventRows =
    deckIds.length === 0
      ? []
      : await db
          .select({
            deckId: flashcardStudyEvents.deckId,
            lastStudiedAt: sql<Date | null>`max(${flashcardStudyEvents.studiedAt})`,
            monthTotal: sql<number>`sum(case when ${flashcardStudyEvents.studiedAt} >= ${start} and ${flashcardStudyEvents.studiedAt} < ${end} then 1 else 0 end)::int`,
            monthCorrect: sql<number>`sum(case when ${flashcardStudyEvents.studiedAt} >= ${start} and ${flashcardStudyEvents.studiedAt} < ${end} and ${flashcardStudyEvents.result} = 'correct' then 1 else 0 end)::int`,
          })
          .from(flashcardStudyEvents)
          .where(
            and(
              eq(flashcardStudyEvents.studentUserId, studentUserId),
              inArray(flashcardStudyEvents.deckId, deckIds)
            )
          )
          .groupBy(flashcardStudyEvents.deckId);

  const deckEventMap = new Map(
    deckEventRows.map((row) => [
      row.deckId,
      {
        lastStudiedAt: row.lastStudiedAt,
        monthTotal: Number(row.monthTotal ?? 0),
        monthCorrect: Number(row.monthCorrect ?? 0),
      },
    ])
  );

  const assignedCount = quizzes.length;
  const completedCount = quizzes.filter((row) => !!row.submission).length;
  const completionRate =
    assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

  const flashcardTotal = Number(flashcardAggregate?.total ?? 0);
  const flashcardCorrect = Number(flashcardAggregate?.correct ?? 0);

  return {
    monthRange,
    quizStats: {
      assignedCount,
      completedCount,
      completionRate,
      averageScoreThisMonth:
        quizAggregate?.avgScore != null ? Math.round(Number(quizAggregate.avgScore)) : null,
      lastQuizScore: lastQuiz?.score ?? null,
    },
    flashcardsStudiedThisMonth: flashcardTotal,
    flashcardAccuracyThisMonth: toAccuracy(flashcardCorrect, flashcardTotal),
    savedWordsCount,
    assignedDecks: assignedDecks.map((deck) => {
      const event = deckEventMap.get(deck.id);
      const monthTotal = event?.monthTotal ?? 0;
      const monthCorrect = event?.monthCorrect ?? 0;
      return {
        id: deck.id,
        title: deck.title,
        cardCount: deck.cardCount,
        lastStudiedAt: event?.lastStudiedAt ?? null,
        accuracyThisMonth: toAccuracy(monthCorrect, monthTotal),
      };
    }),
  };
}

