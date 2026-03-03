export const dynamic = 'force-dynamic';

import { requireRole } from '@/lib/auth/user';
import {
  getSchoolAdminKpis,
  getSchoolAdminClassTable,
  getSchoolAdminNeedsAttention,
} from '@/lib/db/queries/school-admin-dashboard';
import { getSchoolMonthSummary } from '@/lib/db/queries/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GraduationCap, Users, BookOpen, AlertTriangle } from 'lucide-react';
import { SchoolAttendanceMonthCard } from '@/components/attendance/AttendanceMonthSummaryCard';
import { SchoolAdminClassTable } from './SchoolAdminClassTable';

export default async function SchoolAdminDashboardPage() {
  await requireRole(['school_admin']);

  const [kpis, classRows, needsAttention, schoolAttendanceSummary] = await Promise.all([
    getSchoolAdminKpis(),
    getSchoolAdminClassTable(),
    getSchoolAdminNeedsAttention(),
    getSchoolMonthSummary(),
  ]);

  return (
    <section className="flex-1">
      <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-2 tracking-tight">
        School Admin Dashboard
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        How are classes doing right now?
      </p>

      {/* Attendance This Month */}
      <div className="mb-6 sm:mb-8">
        <SchoolAttendanceMonthCard
          attendanceRate={schoolAttendanceSummary.attendanceRate}
          lateRate={schoolAttendanceSummary.lateRate}
          participationAvg={schoolAttendanceSummary.participationAvg}
          atRiskCount={schoolAttendanceSummary.atRiskCount}
        />
      </div>

      {/* KPI cards - mobile: slim horizontal; desktop: full cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-col sm:items-stretch sm:justify-normal sm:p-5 sm:gap-0">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground sm:mb-1">
            <Users className="h-4 w-4 shrink-0" />
            <span>Active students</span>
          </div>
          <p className="text-xl font-semibold text-[#1f2937] shrink-0 sm:text-2xl">
            {kpis.activeStudents}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-col sm:items-stretch sm:justify-normal sm:p-5 sm:gap-0">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground sm:mb-1">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>Active classes</span>
          </div>
          <p className="text-xl font-semibold text-[#1f2937] shrink-0 sm:text-2xl">
            {kpis.activeClasses}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-col sm:items-stretch sm:justify-normal sm:p-5 sm:gap-0">
          <div className="text-sm font-medium text-muted-foreground sm:mb-1">
            Avg quiz score (7d / 30d)
          </div>
          <p className="text-xl font-semibold text-[#1f2937] shrink-0 sm:text-2xl">
            {kpis.avgQuizScore7d != null ? `${kpis.avgQuizScore7d}%` : '—'}
            {' / '}
            {kpis.avgQuizScore30d != null ? `${kpis.avgQuizScore30d}%` : '—'}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-col sm:items-stretch sm:justify-normal sm:p-5 sm:gap-0">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground sm:mb-1">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Completion rate (30d)</span>
          </div>
          <p className="text-xl font-semibold text-[#1f2937] shrink-0 sm:text-2xl">
            {kpis.completionRate30d}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Class table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click column headers to sort.
              </p>
            </CardHeader>
            <CardContent>
              {classRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No classes yet.
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
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Needs attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {needsAttention.lowScoreClasses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Classes with avg score &lt; 70%
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
                    Students with 0 attempts in 14 days
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
                    Quizzes &lt; 50% attempted
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
                    Nothing needs attention right now.
                  </p>
                )}
            </CardContent>
          </Card>

          <Button asChild className="mt-4 w-full rounded-full bg-[#429ead] text-white hover:bg-[#36899a]">
            <Link href="/dashboard/admin/classes">
              <GraduationCap className="mr-2 h-4 w-4" />
              Manage classes
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
