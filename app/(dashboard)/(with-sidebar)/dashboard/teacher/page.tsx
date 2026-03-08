export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import {
  getTeacherDashboardClasses,
  getTeacherDashboardKpis,
  getTeacherDashboardNeedsAttention,
  getTeacherNextSession,
  getTeacherTodaySummary,
} from '@/lib/db/queries/teacher-dashboard';
import { SetTimezoneOnMount } from '@/components/calendar/SetTimezoneOnMount';
import { NextClassCard } from './NextClassCard';
import { TeacherAttentionSummary } from './TeacherAttentionSummary';
import { TeacherQuickActions } from './TeacherQuickActions';
import { TeacherClassesPreview } from './TeacherClassesPreview';
import { AlertTriangle } from 'lucide-react';

export default async function TeacherDashboardPage() {
  const user = await requireRole(['teacher']);
  const locale = await getLocale();
  const t = await getTranslations('teacher.dashboard');

  const viewerTimezone = user.timezone ?? 'UTC';
  const [classes, nextSession, kpis, needsAttention, todaySummary] =
    await Promise.all([
      getTeacherDashboardClasses(user.id),
      getTeacherNextSession(user.id),
      getTeacherDashboardKpis(user.id),
      getTeacherDashboardNeedsAttention(user.id),
      getTeacherTodaySummary(user.id),
    ]);

  const hasDetailedNeedsAttention =
    needsAttention.inactiveStudents.length > 0 ||
    needsAttention.lowCompletionQuizzes.length > 0;

  return (
    <section className="flex-1 overflow-y-auto p-4 lg:p-6">
      {user.timezone === null && <SetTimezoneOnMount />}

      <header className="mb-6">
        <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </header>

      {/* 1. Next Class — top priority with countdown */}
      <div className="mb-6">
        <NextClassCard
          nextSession={nextSession}
          viewerTimezone={viewerTimezone}
        />
      </div>

      {/* 2. Today / Needs Attention */}
      <div className="mb-6 rounded-xl border border-[#e5e7eb] bg-white p-4">
        <TeacherAttentionSummary
          classesTodayCount={todaySummary.classesTodayCount}
          homeworkToReviewCount={todaySummary.homeworkToReviewCount}
          attendanceNeeded={todaySummary.attendanceNeeded}
        />
      </div>

      {/* 3. Quick Actions */}
      <div className="mb-6">
        <TeacherQuickActions />
      </div>

      {/* 4. Slim KPIs strip */}
      <div className="mb-6 flex flex-wrap gap-6 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
        <div>
          <span className="text-xs text-muted-foreground">
            {t('avgQuizScore30d')}
          </span>
          <p className="text-lg font-semibold text-[#1f2937]">
            {kpis.avgQuizScore30d != null ? `${kpis.avgQuizScore30d}%` : '—'}
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">
            {t('attemptRate30d')}
          </span>
          <p className="text-lg font-semibold text-[#1f2937]">
            {kpis.attemptRate30d}%
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">
            {t('inactiveStudents')}
          </span>
          <p className="text-lg font-semibold text-[#1f2937]">
            {kpis.inactiveStudents}
          </p>
        </div>
      </div>

      {/* 5. Detailed needs attention (inactive students, low completion quizzes) */}
      {hasDetailedNeedsAttention && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-[#1f2937]">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
            {t('needsAttention')}
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {needsAttention.inactiveStudents.map((s) => (
              <li key={`${s.studentId}-${s.classId}`}>
                <Link
                  href={`/dashboard/students/${s.studentId}`}
                  className="text-primary hover:underline"
                >
                  {s.studentName ?? `Student #${s.studentId}`}
                </Link>
                <span className="ml-2 text-muted-foreground">
                  {t('inactiveStudentLabel')}
                </span>
              </li>
            ))}
            {needsAttention.lowCompletionQuizzes.map((q) => (
              <li key={`${q.quizId}-${q.className}`}>
                <span className="font-medium">{q.quizTitle}</span>
                <span className="ml-2 text-muted-foreground">
                  {t('lowCompletionLabel', {
                    className: q.className,
                    percent: q.attemptPct,
                  })}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            <Link
              href={`/${locale}/teacher/classes`}
              className="text-sm text-primary hover:underline"
            >
              {t('viewAll')}
            </Link>
          </p>
        </div>
      )}

      {/* 6. My Classes preview */}
      <div className="mb-6">
        <TeacherClassesPreview
          classes={classes}
          viewerTimezone={viewerTimezone}
          nextSessionRef={
            nextSession
              ? { classId: nextSession.classId, startsAt: nextSession.startsAt }
              : null
          }
        />
      </div>
    </section>
  );
}
