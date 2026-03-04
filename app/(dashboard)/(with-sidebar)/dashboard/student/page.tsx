export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getStudentDashboardData } from '@/lib/db/queries/education';
import {
  getStudentDashboardStats,
  getStudentNeedsAttention,
} from '@/lib/db/queries/student-dashboard';
import { getStudentMonthSummary } from '@/lib/db/queries/attendance';
import { StudentAttendanceMonthCard } from '@/components/attendance/AttendanceMonthSummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  Video,
  ArrowRight,
} from 'lucide-react';
import { PercentRing } from '@/components/dashboard/PercentRing';
import { ProgressBar } from '@/components/dashboard/ProgressBar';

function ScoreRing({
  score,
  size,
  strokeWidth,
}: {
  score: number | null;
  size: number;
  strokeWidth: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? (score / 100) * circumference : 0;
  const strokeColor =
    score == null
      ? '#e5e7eb'
      : score >= 80
        ? '#7daf41'
        : score >= 65
          ? '#429ead'
          : '#f59e0b';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-semibold text-[#1f2937]">
          {score != null ? `${score}%` : '—'}
        </span>
      </div>
    </div>
  );
}

function isToday(d: Date): boolean {
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const t = await getTranslations('dashboard.student');
  const tCommon = await getTranslations('common');
  const user = await requireRole(['student']);
  const params = await searchParams;

  const [data, stats, needsAttention, attendanceSummary] = await Promise.all([
    getStudentDashboardData(user.id),
    getStudentDashboardStats(user.id),
    getStudentNeedsAttention(user.id),
    getStudentMonthSummary({ studentUserId: user.id }),
  ]);

  const hasNeedsAttention =
    needsAttention.incompleteQuizzes.length > 0 || needsAttention.noActivityIn7Days;

  const statusMessage =
    stats.avgScore30d == null
      ? t('status.startTakingQuizzes')
      : stats.avgScore30d >= 80
        ? t('status.onTrack')
        : stats.avgScore30d >= 65
          ? t('status.keepImproving')
          : t('status.needsAttention');

  const statusColor =
    stats.avgScore30d == null
      ? 'text-muted-foreground'
      : stats.avgScore30d >= 80
        ? 'text-[#7daf41]'
        : stats.avgScore30d >= 65
          ? 'text-[#429ead]'
          : 'text-amber-600';

  const firstName = user.name?.split(/\s+/)[0] ?? 'there';
  const attendanceRate30d = Math.round((stats.activeDays30d / 30) * 100);

  return (
    <section className="flex-1">
      <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-2 tracking-tight">
        {user.name ? t('welcomeWithName', { name: firstName }) : t('welcome')}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('subtitle')}
      </p>

      {params.joined === '1' && (
        <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-[#7daf41]/10 px-5 py-4 text-sm text-[#1f2937] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {t('joinedBanner')}
        </div>
      )}

      {!data.hasClasses ? (
        <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle>{t('classCard.title')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('classCard.body')}
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="primary" className="rounded-full">
              <Link href="/dashboard/student/join">{t('classCard.cta')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 1. Top Stats Row — compact, mobile-friendly */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Avg score (30d) — label + % left, donut right (blue accent) */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-5 sm:py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('avgScoreTitle')}
                </span>
                <p className="text-xl font-semibold text-[#1f2937] sm:text-2xl">
                  {stats.avgScore30d != null ? `${stats.avgScore30d}%` : '—'}
                </p>
              </div>
              <PercentRing
                value={stats.avgScore30d}
                size={48}
                strokeWidth={5}
                fillColor="#429ead"
                className="shrink-0"
                aria-label={
                  stats.avgScore30d != null
                    ? t('avgScoreAria', { percent: stats.avgScore30d })
                    : t('avgScoreNotAvailable')
                }
              />
            </div>
            {/* Attendance rate (30d) — label + % on top, progress bar at bottom */}
            <div className="flex flex-col gap-2 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-5 sm:py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('attendanceTitle')}
                </span>
                <p className="text-xl font-semibold text-[#1f2937] sm:text-2xl">
                  {attendanceRate30d}%
                </p>
              </div>
              <ProgressBar
                value={attendanceRate30d}
                aria-label={t('attendanceAria', { percent: attendanceRate30d })}
              />
            </div>
            {/* Quizzes completed — label left, number right (reddish-brown accent) */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-5 sm:py-3">
              <span className="text-sm font-medium text-muted-foreground min-w-0">
                {t('quizzesCompletedTitle')}
              </span>
              <p className="text-xl font-bold text-[#b64b29] shrink-0 sm:text-2xl" aria-label={t('quizzesCompletedAria', { count: stats.quizzesCompleted })}>
                {stats.quizzesCompleted}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 2. Next Class (primary focus) — blue card, white text */}
            <div className="lg:col-span-2">
              <Card className="mb-6 rounded-2xl border-transparent bg-[#429ead] shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Video className="h-5 w-5 text-white/90" aria-hidden />
                    {t('nextClassTitle')}
                    {data.nextSessions.length > 0 &&
                      isToday(new Date(data.nextSessions[0].session.startsAt)) && (
                        <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                          {t('nextClassToday')}
                        </span>
                      )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  {data.nextSessions.length === 0 ? (
                    <>
                      <p className="text-sm text-white/90 py-2">
                        {t('nextClassEmpty')}
                      </p>
                      <Link
                        href={`/classroom/${data.primaryClass.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors"
                      >
                        <BookOpen className="h-4 w-4" />
                        {t('nextClassOpenClassroom')}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">
                            {data.nextSessions[0].session.title ??
                              data.nextSessions[0].className}
                          </p>
                          <p className="text-sm text-white/85 mt-0.5">
                            {data.nextSessions[0].className}
                          </p>
                          <p className="text-sm text-white/85 mt-1">
                            {new Date(
                              data.nextSessions[0].session.startsAt
                            ).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}{' '}
                            –{' '}
                            {new Date(
                              data.nextSessions[0].session.endsAt
                            ).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {data.nextSessions[0].session.meetingUrl ? (
                          <Button
                            size="lg"
                            className="rounded-full shrink-0 bg-white text-[#429ead] hover:bg-white/90 hover:text-[#388694] border-0"
                            asChild
                          >
                            <a
                              href={data.nextSessions[0].session.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Video className="mr-2 h-4 w-4" />
                              {t('nextClassJoinMeeting')}
                            </a>
                          </Button>
                        ) : (
                          <Button
                            size="lg"
                            className="rounded-full shrink-0 bg-white/20 text-white border border-white/40 cursor-not-allowed"
                            disabled
                          >
                            {t('nextClassJoinMeetingDisabled')}
                          </Button>
                        )}
                      </div>
                      <Link
                        href={`/classroom/${data.primaryClass.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors"
                      >
                        <BookOpen className="h-4 w-4" />
                        {t('nextClassOpenClassroom')}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 5. Upcoming Sessions (condensed, max 3) */}
              {data.nextSessions.length > 1 && (
                <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#429ead]" aria-hidden />
                      {t('upcomingSessionsTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {data.nextSessions.slice(1, 4).map(({ session, className }) => (
                        <li
                          key={session.id}
                          className="flex items-center justify-between rounded-lg border border-[#e5e7eb]/60 bg-muted/30 px-4 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#1f2937]">
                              {session.title ?? className}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.startsAt).toLocaleString()}
                            </p>
                          </div>
                          {session.meetingUrl ? (
                            <Button variant="secondary" size="sm" className="rounded-full" asChild>
                              <a
                                href={session.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {t('nextClassJoinMeeting')}
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 3. My Progress + 4. Needs Attention + What to do next */}
            <div className="space-y-6">
              {/* Attendance — This month */}
              <StudentAttendanceMonthCard
                attendanceRate={attendanceSummary.attendanceRate}
                presentCount={attendanceSummary.presentCount}
                lateCount={attendanceSummary.lateCount}
                absentCount={attendanceSummary.absentCount}
                participationAvg={attendanceSummary.participationAvg}
                title={tCommon('thisMonth')}
              />

              {/* What to do next */}
              <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-[#429ead]" aria-hidden />
                    {t('whatToDoNextTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {needsAttention.incompleteQuizzes.length > 0 ? (
                    <Link
                      href={`/learning/${needsAttention.incompleteQuizzes[0].quizId}`}
                      className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-muted/30 px-4 py-3 text-sm font-medium text-[#1f2937] hover:bg-muted/50 transition-colors"
                    >
                      {t('whatToDoNextCompleteQuiz', { quizTitle: needsAttention.incompleteQuizzes[0].quizTitle })}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ) : data.nextSessions.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('whatToDoNextJoinNextClass', {
                        date: new Date(data.nextSessions[0].session.startsAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        }),
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('whatToDoNextAllCaughtUp')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* My Progress */}
              <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#7daf41]" aria-hidden />
                    {t('myProgressTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-6">
                    <ScoreRing score={stats.avgScore30d} size={108} strokeWidth={10} />
                    <div className="min-w-0">
                      <p className={`font-medium ${statusColor}`}>{statusMessage}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('myProgress30d')}</p>
                      {stats.avgScore30d != null && stats.avgScore30d < 80 && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t('myProgressGoalAway', { percent: 80 - stats.avgScore30d })}
                        </p>
                      )}
                      {stats.avgScore30d != null && stats.avgScore30d >= 80 && (
                        <p className="text-xs text-[#7daf41] mt-1.5">
                          {t('myProgressGoalReached')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="secondary" size="sm" className="rounded-full w-full">
                    <Link href="/dashboard/profile">{t('myProgressViewScores')}</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Needs Attention — only when score <65 or critical items; avoid orange overload */}
              {hasNeedsAttention && (
                <Card className="rounded-2xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />
                      {t('needsAttentionTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {needsAttention.incompleteQuizzes.map((q) => (
                      <p key={q.quizId} className="text-sm text-[#1f2937]">
                        {t('needsAttentionPrefix')}
                        <Link
                          href={`/learning/${q.quizId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {q.quizTitle}
                        </Link>
                        {q.className && (
                          <span className="text-muted-foreground"> ({q.className})</span>
                        )}
                      </p>
                    ))}
                    {needsAttention.noActivityIn7Days && (
                      <p className="text-sm text-[#1f2937]">
                        {t('needsAttentionNoActivity')}
                      </p>
                    )}
                    <Button asChild variant="outline" size="sm" className="mt-3 rounded-full w-full">
                      <Link href="/dashboard/student/learning">
                        <BookOpen className="mr-2 h-4 w-4" />
                        {t('needsAttentionOpenLearning')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
