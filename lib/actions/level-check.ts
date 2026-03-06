'use server';

import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { geckoPlacementResults } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/user';
import {
  PLACEMENT_QUESTIONS,
  GEKO_WEIGHTS,
  scoreToLevel,
  type GeckoLevel,
} from '@/lib/level-check/questions';

export type AnswerInput = {
  questionId: string;
  value: string | string[]; // string for multiple_choice/vocabulary, string[] for sentence_ordering
};

export type WritingInput = {
  questionId: string;
  value: string;
};

export async function submitPlacementAction(
  answers: AnswerInput[],
  writingResponses: WritingInput[] = []
) {
  const user = await requireAuth();

  const answersMap = new Map(answers.map((a) => [a.questionId, a.value]));
  const writingMap = new Map(
    writingResponses.map((w) => [w.questionId, w.value] as const)
  );

  let totalScore = 0;

  for (const q of PLACEMENT_QUESTIONS) {
    const weight = GEKO_WEIGHTS[q.level as GeckoLevel];

    if (q.type === 'writing') {
      const text = writingMap.get(q.id)?.trim() ?? '';
      // Basic validation: non-empty response with reasonable length gets partial points
      if (text.length >= 20) {
        totalScore += weight;
      } else if (text.length >= 5) {
        totalScore += Math.floor(weight / 2);
      }
      continue;
    }

    const userAnswer = answersMap.get(q.id);

    if (q.type === 'multiple_choice' || q.type === 'vocabulary') {
      const correctChoice = q.choices?.find((c) => c.correct);
      const correctValue = correctChoice?.value;
      if (
        userAnswer &&
        correctValue !== undefined &&
        String(userAnswer).trim().toLowerCase() === String(correctValue).trim().toLowerCase()
      ) {
        totalScore += weight;
      }
    } else if (q.type === 'sentence_ordering') {
      const userOrder = Array.isArray(userAnswer) ? userAnswer : [];
      const correctOrder = q.correctOrder ?? [];
      const userStr = userOrder.join(' ').trim().toLowerCase();
      const correctStr = correctOrder.join(' ').trim().toLowerCase();
      if (userStr === correctStr) {
        totalScore += weight;
      }
    }
  }

  const placementLevel = scoreToLevel(totalScore);

  const answersRecord: Record<string, unknown> = {};
  for (const a of answers) {
    answersRecord[a.questionId] = a.value;
  }
  const writingRecord: Record<string, string> = {};
  for (const w of writingResponses) {
    writingRecord[w.questionId] = w.value;
  }

  await db.insert(geckoPlacementResults).values({
    userId: user.id,
    placementScore: totalScore,
    placementLevel,
    answers: answersRecord,
    writingResponses: writingRecord,
  });

  const locale = await getLocale();
  redirect(`/${locale}/level-check/result?score=${totalScore}&level=${placementLevel}`);
}

export async function getLatestPlacementResult() {
  const user = await requireAuth();
  const rows = await db
    .select()
    .from(geckoPlacementResults)
    .where(eq(geckoPlacementResults.userId, user.id))
    .orderBy(desc(geckoPlacementResults.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
