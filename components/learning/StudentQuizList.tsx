import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  getQuizzesForStudentClasses,
  getQuizResultsForStudentProfile,
} from '@/lib/db/queries/quizzes';
import { getStudentDashboardStats } from '@/lib/db/queries/student-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle2, TrendingUp } from 'lucide-react';

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-[#7daf41]';
  if (score >= 70) return 'text-[#6b7280]';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBgClass(score: number): string {
  if (score >= 80) return 'bg-[#7daf41]/10';
  if (score >= 70) return 'bg-[#6b7280]/10';
  if (score >= 60) return 'bg-amber-500/10';
  return 'bg-red-500/10';
}

export async function StudentQuizList({
  studentUserId,
  showIntro = true,
}: {
  studentUserId: number;
  showIntro?: boolean;
}) {
  const t = await getTranslations('quizzes');
  const tLearning = await getTranslations('learning');
  const [quizzes, stats, assessments] = await Promise.all([
    getQuizzesForStudentClasses(studentUserId),
    getStudentDashboardStats(studentUserId),
    getQuizResultsForStudentProfile(studentUserId),
  ]);

  const latest = quizzes[0] ?? null;
  const completedCount = quizzes.filter((q) => q.submission).length;
  const completionRate =
    quizzes.length > 0 ? Math.round((completedCount / quizzes.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {showIntro && (
        <div>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-2 tracking-tight">
            {tLearning('title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('weeklyQuizzes')}</p>
        </div>
      )}

      {latest && (
        <>
          <Card
            className={`rounded-2xl border-2 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
              !latest.submission ? 'border-[#7daf41]/50' : 'border-[#e5e7eb]'
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {t('thisWeek')}
                <span className="inline-flex rounded-full bg-[#e5e7eb]/80 px-2.5 py-0.5 text-xs font-medium text-[#6b7280]">
                  {t('thisWeek')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <p className="font-medium text-[#1f2937]">{latest.quiz.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{latest.className}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {latest.submission ? (
                  <>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${scoreBgClass(latest.submission.score)} ${scoreColorClass(latest.submission.score)}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {latest.submission.score}%
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 rounded-full bg-[#429ead] px-3 text-xs text-white hover:bg-[#36899a]"
                      asChild
                    >
                      <Link href={`/learning/${latest.quiz.id}`}>{t('review')}</Link>
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" size="sm" className="rounded-full" asChild>
                    <Link href={`/learning/${latest.quiz.id}`}>{t('startQuiz')}</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-8 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-2">
              <span className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <TrendingUp className="h-4 w-4 shrink-0" />
                {t('avgScore30d')}
              </span>
              <span className="text-sm font-bold text-[#1f2937]">
                {stats.avgScore30d != null ? `${stats.avgScore30d}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-2">
              <span className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t('lastQuiz')}
              </span>
              <span className="text-sm font-bold text-[#1f2937]">
                {assessments.lastQuiz != null ? `${assessments.lastQuiz.score}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-2">
              <span className="text-xs text-[#9ca3af]">{t('completion')}</span>
              <span className="text-sm font-bold text-[#1f2937]">{completionRate}%</span>
            </div>
          </div>
        </>
      )}

      <Card className="rounded-2xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-2">
          <CardTitle>{t('allQuizzes')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-5">
          {quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-3" aria-hidden />
              <p className="font-medium text-[#1f2937]">{t('noQuizzesYet')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('noQuizzesYetDesc')}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#9ca3af] mb-3">
                {quizzes.length === 1 ? t('showingCount', { count: quizzes.length }) : t('showingCountPlural', { count: quizzes.length })}
              </p>
              <ul className="space-y-1.5">
                {quizzes.map(({ quiz, className, submission }) => (
                  <li
                    key={quiz.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e7eb]/60 bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#1f2937] truncate text-sm">{quiz.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[#9ca3af] truncate">{className}</p>
                        {submission && (
                          <span
                            className={`shrink-0 text-xs font-semibold ${scoreColorClass(submission.score)}`}
                          >
                            {submission.score}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 shrink-0 rounded-full bg-[#429ead] px-3 text-xs text-white hover:bg-[#36899a]"
                      asChild
                    >
                      <Link href={`/learning/${quiz.id}`}>{submission ? t('review') : t('startQuiz')}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

