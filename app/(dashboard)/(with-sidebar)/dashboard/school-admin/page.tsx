export const dynamic = 'force-dynamic';

import { getTranslations, getLocale } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import {
  getSchoolAdminKpis,
  getSchoolAdminClassTable,
  getSchoolAdminNeedsAttention,
} from '@/lib/db/queries/school-admin-dashboard';
import { getSchoolMonthSummary } from '@/lib/db/queries/attendance';
import { getSchoolIdsForUser, getSchoolById } from '@/lib/db/queries/schools';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GraduationCap, Users, BookOpen, AlertTriangle } from 'lucide-react';
import { SchoolAttendanceMonthCard } from '@/components/attendance/AttendanceMonthSummaryCard';
import { SchoolAdminClassTable } from './SchoolAdminClassTable';

export default async function SchoolAdminDashboardPage() {
  const user = await requireRole(['school_admin']);
  const locale = await getLocale();
  const t = await getTranslations('schoolAdmin.dashboard');
  const tAttendance = await getTranslations('schoolAdmin.attendance');
  const tCommon = await getTranslations('common');

  const schoolIds = await getSchoolIdsForUser(user.id);
  const firstSchool =
    schoolIds.length > 0 ? await getSchoolById(schoolIds[0]) : null;
  const schoolName = firstSchool?.name ?? null;

  const [kpis, classRows, needsAttention, schoolAttendanceSummary] = await Promise.all([
    getSchoolAdminKpis(schoolIds),
    getSchoolAdminClassTable(schoolIds),
    getSchoolAdminNeedsAttention(schoolIds),
    getSchoolMonthSummary(schoolIds),
  ]);

  const completionRate = Math.max(0, Math.min(100, kpis.completionRate30d ?? 0));
  const completionDegrees = completionRate * 3.6;

  const title = schoolName
    ? t('titleWithSchool', { schoolName })
    : t('titleFallback');
  const subtitle = schoolName
    ? t('subtitleWithSchool', { schoolName })
    : t('subtitleFallback');

  return (
    <section className="flex-1">
      <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-2 tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {subtitle}
      </p>

      {/* Attendance This Month */}
      <div className="mb-6 sm:mb-8">
        <SchoolAttendanceMonthCard
          attendanceRate={schoolAttendanceSummary.attendanceRate}
          lateRate={schoolAttendanceSummary.lateRate}
          participationAvg={schoolAttendanceSummary.participationAvg}
          atRiskCount={schoolAttendanceSummary.atRiskCount}
          title={tAttendance('titleThisMonth')}
          overallLabel={tAttendance('overall')}
          lateRateLabel={tAttendance('lateRate')}
          avgParticipationLabel={tAttendance('avgParticipation')}
          atRiskLabel={tAttendance('atRiskStudents')}
          viewDetailsLabel={tCommon('viewDetails')}
        />
      </div>

      {/* KPI cards - neutral white cards with gray borders */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-col sm:items-stretch sm:justify-normal sm:p-5 sm:gap-1">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600 sm:mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Users className="h-4 w-4 text-slate-600" />
            </div>
            <span>{t('activeStudents')}</span>
          </div>
          <p className="text-xl font-semibold text-slate-900 shrink-0 sm:text-2xl">
            {kpis.activeStudents}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-col sm:items-stretch sm:justify-normal sm:p-5 sm:gap-1">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600 sm:mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <GraduationCap className="h-4 w-4 text-slate-600" />
            </div>
            <span>{t('activeClasses')}</span>
          </div>
          <p className="text-xl font-semibold text-slate-900 shrink-0 sm:text-2xl">
            {kpis.activeClasses}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-col sm:items-stretch sm:justify-normal sm:p-5 sm:gap-1">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600 sm:mb-1">
            <span>{t('avgQuizScoreLabel')}</span>
          </div>
          <p className="text-xl font-semibold text-slate-900 shrink-0 sm:text-2xl">
            {kpis.avgQuizScore7d != null ? `${kpis.avgQuizScore7d}%` : '—'}
            {' / '}
            {kpis.avgQuizScore30d != null ? `${kpis.avgQuizScore30d}%` : '—'}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-col sm:items-stretch sm:justify-normal sm:p-5 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600 sm:mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <BookOpen className="h-4 w-4 text-slate-600" />
            </div>
            <span>{t('completionRate30d')}</span>
          </div>
          <div className="flex items-center gap-3 sm:justify-between">
            <p className="text-xl font-semibold text-slate-900 shrink-0 sm:text-2xl">
              {completionRate}%
            </p>
            <div
              className="relative h-12 w-12 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(#475569 ${completionDegrees}deg, #e2e8f0 0deg)`,
              }}
            >
              <div className="absolute inset-[3px] rounded-full bg-white" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-900">
                {completionRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Class table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('classes')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('clickToSort')}
              </p>
            </CardHeader>
            <CardContent>
              {classRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('noClassesYet')}
                </p>
              ) : (
                <SchoolAdminClassTable rows={classRows} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Needs attention */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {t('needsAttention')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {needsAttention.lowScoreClasses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t('lowScoreClasses')}
                  </p>
                  <ul className="space-y-1">
                    {needsAttention.lowScoreClasses.map((c) => (
                      <li key={c.classId}>
                        <Link
                          href={`/classroom/${c.classId}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {c.className}
                        </Link>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({c.avgScore}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {needsAttention.inactiveStudents.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t('inactiveStudents14d')}
                  </p>
                  <ul className="space-y-1">
                    {needsAttention.inactiveStudents.map((s) => (
                      <li key={s.studentId}>
                        <Link
                          href={`/dashboard/students/${s.studentId}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {s.studentName ?? `Student #${s.studentId}`}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {needsAttention.lowAttemptQuizzes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t('lowAttemptQuizzes')}
                  </p>
                  <ul className="space-y-1">
                    {needsAttention.lowAttemptQuizzes.map((q) => (
                      <li key={`${q.quizId}-${q.className}`} className="text-sm">
                        <span className="font-medium">{q.quizTitle}</span>
                        <span className="text-muted-foreground ml-1">
                          {q.className} ({q.attemptPct}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {needsAttention.lowScoreClasses.length === 0 &&
                needsAttention.inactiveStudents.length === 0 &&
                needsAttention.lowAttemptQuizzes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t('nothingNeedsAttention')}
                  </p>
                )}
            </CardContent>
          </Card>

          <Button asChild className="mt-4 w-full rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]">
            <Link href={`/${locale}/dashboard/school-admin/school`}>
              <GraduationCap className="mr-2 h-4 w-4" />
              {t('manageClasses')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
