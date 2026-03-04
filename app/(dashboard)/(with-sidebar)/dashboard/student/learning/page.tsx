export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { StudentQuizList } from '@/components/learning/StudentQuizList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getMonthRangeFromKey,
  getStudentLearningOverview,
  getThisMonthRange,
} from '@/lib/db/queries/flashcards';
import { BookMarked, BookOpen, Bookmark, TrendingUp } from 'lucide-react';

function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

function previousMonthKeys(count: number): string[] {
  const base = new Date();
  const keys: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    keys.push(monthKeyFromDate(d));
  }
  return keys;
}

type Props = {
  searchParams: Promise<{ tab?: string; month?: string }>;
};

export default async function StudentLearningPage({ searchParams }: Props) {
  const t = await getTranslations('learning');
  const user = await requireRole(['student']);
  const { tab: tabQuery, month: monthQuery } = await searchParams;
  const tab = tabQuery === 'flashcards' ? 'flashcards' : 'quizzes';

  const fallbackRange = getThisMonthRange();
  const monthRange = monthQuery ? getMonthRangeFromKey(monthQuery) ?? fallbackRange : fallbackRange;
  const selectedMonthKey = monthKeyFromDate(monthRange.start);
  const isThisMonth = selectedMonthKey === monthKeyFromDate(new Date());

  const overview =
    tab === 'flashcards'
      ? await getStudentLearningOverview(user.id, { monthRange })
      : null;

  return (
    <section className="flex-1">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#e5e7eb] bg-white p-2">
          <Link
            href="/dashboard/student/learning?tab=quizzes"
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium ${
              tab === 'quizzes'
                ? 'bg-[#429ead] text-white'
                : 'text-[#1f2937] hover:bg-[#f3f4f6]'
            }`}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {t('quizzes')}
          </Link>
          <Link
            href={`/dashboard/student/learning?tab=flashcards&month=${selectedMonthKey}`}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium ${
              tab === 'flashcards'
                ? 'bg-[#7daf41] text-white'
                : 'text-[#1f2937] hover:bg-[#f3f4f6]'
            }`}
          >
            <BookMarked className="mr-2 h-4 w-4" />
            {t('flashcards')}
          </Link>
        </div>

        {tab === 'quizzes' ? (
          <StudentQuizList studentUserId={user.id} showIntro={false} />
        ) : (
          <div className="space-y-5">
            {overview?.storageReady ? (
              <>
                <Card className="rounded-2xl border border-[#e5e7eb]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">
                        {isThisMonth ? t('thisMonth') : monthLabel(selectedMonthKey)}
                      </CardTitle>
                      <details>
                        <summary className="cursor-pointer text-sm text-[#429ead]">
                          {t('previousMonths')}
                        </summary>
                        <ul className="mt-2 space-y-1 text-sm">
                          {previousMonthKeys(3).map((key) => (
                            <li key={key}>
                              <Link
                                href={`/dashboard/student/learning?tab=flashcards&month=${key}`}
                                className="text-[#429ead] hover:underline"
                              >
                                {monthLabel(key)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-[#7daf41] px-4 py-3 text-white">
                        <p className="text-xs">{t('studied')}</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {overview.flashcardsStudiedThisMonth}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#429ead] px-4 py-3 text-white">
                        <p className="text-xs">{t('accuracy')}</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {overview.flashcardAccuracyThisMonth != null
                            ? `${overview.flashcardAccuracyThisMonth}%`
                            : '—'}
                        </p>
                      </div>
                      <div
                        className="rounded-2xl px-4 py-3 text-white"
                        style={{ backgroundColor: 'var(--accent-brown, #b64b29)' }}
                      >
                        <p className="text-xs">{t('savedWords')}</p>
                        <p className="mt-1 text-2xl font-semibold">{overview.savedWordsCount}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#e5e7eb] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#1f2937]">{t('mySavedWords')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('mySavedWordsDesc')}
                          </p>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          className="rounded-full bg-[#429ead] text-white hover:bg-[#36899a]"
                        >
                          <Link href="/dashboard/student/learning/flashcards/saved">
                            <Bookmark className="mr-1 h-4 w-4" />
                            {t('study')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-[#e5e7eb]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('assignedDecks')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {overview.assignedDecks.length ? (
                      overview.assignedDecks.map((deck) => (
                        <div
                          key={deck.id}
                          className="rounded-xl border border-[#e5e7eb] bg-white p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium text-[#1f2937]">{deck.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('cardsCount', { count: deck.cardCount })}
                                {deck.lastStudiedAt
                                  ? ` · ${t('lastStudied', { date: new Date(deck.lastStudiedAt).toLocaleDateString() })}`
                                  : ` · ${t('notStartedYet')}`}
                                {deck.accuracyThisMonth != null
                                  ? ` · ${t('thisMonthPct', { percent: deck.accuracyThisMonth })}`
                                  : ''}
                              </p>
                            </div>
                            <Button
                              asChild
                              size="sm"
                              className="rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]"
                            >
                              <Link href={`/dashboard/student/learning/flashcards/${deck.id}`}>
                                {t('study')}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#e5e7eb] p-5 text-center">
                        <p className="text-sm text-muted-foreground">
                          {t('noDecksAssigned')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="rounded-2xl border border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle className="text-base">{t('flashcardsSettingUp')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('flashcardsNotReady')}
                  </p>
                </CardContent>
              </Card>
            )}

            {overview?.storageReady && (
              <Card className="rounded-2xl border border-[#e5e7eb]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#429ead]" />
                    {t('quizSnapshot')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#e5e7eb] p-3">
                    <p className="text-xs text-muted-foreground">{t('assigned')}</p>
                    <p className="text-xl font-semibold text-[#1f2937]">
                      {overview.quizStats.assignedCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e5e7eb] p-3">
                    <p className="text-xs text-muted-foreground">{t('completion')}</p>
                    <p className="text-xl font-semibold text-[#1f2937]">
                      {overview.quizStats.completionRate}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e5e7eb] p-3">
                    <p className="text-xs text-muted-foreground">{t('avgThisMonth')}</p>
                    <p className="text-xl font-semibold text-[#1f2937]">
                      {overview.quizStats.averageScoreThisMonth != null
                        ? `${overview.quizStats.averageScoreThisMonth}%`
                        : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

