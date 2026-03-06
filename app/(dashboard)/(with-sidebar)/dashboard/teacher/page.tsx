export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import {
  getTeacherDashboardClasses,
  getTeacherDashboardKpis,
  getTeacherDashboardNeedsAttention,
  getTeacherNextSession,
} from '@/lib/db/queries/teacher-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, AlertTriangle } from 'lucide-react';
import { TeacherMyClasses } from './teacher-my-classes';

export default async function TeacherDashboardPage() {
  const user = await requireRole(['teacher']);
  const locale = await getLocale();
  const t = await getTranslations('teacher.dashboard');

  const [classes, nextSession, kpis, needsAttention] = await Promise.all([
    getTeacherDashboardClasses(user.id),
    getTeacherNextSession(user.id),
    getTeacherDashboardKpis(user.id),
    getTeacherDashboardNeedsAttention(user.id),
  ]);

  const nextSessionStartsAt = nextSession ? new Date(nextSession.startsAt) : null;
  const within60Min =
    nextSessionStartsAt &&
    nextSessionStartsAt.getTime() - Date.now() <= 60 * 60 * 1000;

  return (
    <section className="flex-1">
      <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-2 tracking-tight">
        {t('title')}
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {t('subtitle')}
      </p>

      {/* 1. My Classes */}
      <TeacherMyClasses classes={classes} />

      {/* 2. Next Session */}
      <Card
        className={`mb-8 ${within60Min ? 'border-[#429ead] border-2 bg-[#429ead]/5' : ''}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#429ead]" aria-hidden />
            {t('nextSession')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!nextSession ? (
            <p className="text-sm text-muted-foreground py-2">
              {t('noUpcomingSessions')}
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link
                  href={`/classroom/${nextSession.classId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {nextSession.title ?? nextSession.className}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(nextSession.startsAt).toLocaleString()}
                </p>
              </div>
              {nextSession.meetingUrl ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <a
                    href={nextSession.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('join')}
                  </a>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" className="rounded-full" disabled>
                  {t('join')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Class Health strip - mobile: slim horizontal; desktop: full strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6 mb-6 sm:mb-8 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:block">
          <span className="text-xs text-muted-foreground">{t('avgQuizScore30d')}</span>
          <p className="text-lg font-semibold text-[#1f2937] sm:mt-0.5">
            {kpis.avgQuizScore30d != null ? `${kpis.avgQuizScore30d}%` : '—'}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:block">
          <span className="text-xs text-muted-foreground">{t('attemptRate30d')}</span>
          <p className="text-lg font-semibold text-[#1f2937] sm:mt-0.5">{kpis.attemptRate30d}%</p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:block">
          <span className="text-xs text-muted-foreground">{t('inactiveStudents')}</span>
          <p className="text-lg font-semibold text-[#1f2937] sm:mt-0.5">{kpis.inactiveStudents}</p>
        </div>
      </div>

      {/* 4. Needs Attention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />
            {t('needsAttention')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {needsAttention.inactiveStudents.length === 0 &&
          needsAttention.lowCompletionQuizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('nothingNeedsAttention')}
            </p>
          ) : (
            <ul className="space-y-2">
              {needsAttention.inactiveStudents.map((s) => (
                <li key={`${s.studentId}-${s.classId}`}>
                  <Link
                    href={`/dashboard/students/${s.studentId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {s.studentName ?? `Student #${s.studentId}`}
                  </Link>
                  <span className="text-xs text-muted-foreground ml-2">
                    {t('inactiveStudentLabel')}
                  </span>
                </li>
              ))}
              {needsAttention.lowCompletionQuizzes.map((q) => (
                <li key={`${q.quizId}-${q.className}`}>
                  <span className="text-sm font-medium">{q.quizTitle}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {t('lowCompletionLabel', { className: q.className, percent: q.attemptPct })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(needsAttention.inactiveStudents.length > 0 ||
            needsAttention.lowCompletionQuizzes.length > 0) && (
            <p className="mt-3 text-xs text-muted-foreground">
              <Link href={`/${locale}/teacher/classes`} className="text-primary hover:underline">
                {t('viewAll')}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
