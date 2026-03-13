export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getStudentDashboardData, listClassroomPosts } from '@/lib/db/queries/education';
import {
  getStudentDashboardStats,
  getStudentNeedsAttention,
} from '@/lib/db/queries/student-dashboard';
import { getStudentMonthSummary } from '@/lib/db/queries/attendance';
import { StudentAttendanceMonthCard } from '@/components/attendance/AttendanceMonthSummaryCard';
import { FormattedDateTimeRange } from '@/components/display/FormattedDateTimeRange';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  AlertTriangle,
  Video,
  ArrowRight,
  Megaphone,
  NotebookPen,
  ClipboardList,
  FileText,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { PercentRing } from '@/components/dashboard/PercentRing';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { GECKO_COLORS } from '@/lib/constants/colors';

function isToday(d: Date): boolean {
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function formatFeedTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return '1w ago';
  return d.toLocaleDateString();
}

const FEED_TYPE_ICONS = {
  announcement: Megaphone,
  homework: NotebookPen,
  quiz: ClipboardList,
  test: FileText,
  recording: Video,
  document: FileText,
} as const;

const FEED_TYPE_LABELS: Record<string, string> = {
  announcement: 'Announcement',
  homework: 'Homework',
  quiz: 'Quiz',
  test: 'Test',
  recording: 'Recording',
  document: 'Document',
};

/** Icon colors for Class updates (neutral gray rows, color only in icons). */
const CLASS_UPDATE_ICON_COLOR = GECKO_COLORS.blue; // #429ead

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const t = await getTranslations('dashboard.student');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const user = await requireRole(['student']);
  const viewerTimezone = user.timezone ?? 'UTC';
  const params = await searchParams;

  function withLocalePrefix(path: string): string {
    const base = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${base}`;
  }

  const [data, stats, needsAttention, attendanceSummary] = await Promise.all([
    getStudentDashboardData(user.id),
    getStudentDashboardStats(user.id),
    getStudentNeedsAttention(user.id),
    getStudentMonthSummary({ studentUserId: user.id }),
  ]);

  const classFeedItems =
    data.hasClasses ? await listClassroomPosts(data.primaryClass.id, 3) : [];

  const hasNeedsAttention =
    needsAttention.incompleteQuizzes.length > 0 || needsAttention.noActivityIn7Days;

  const firstName = user.name?.split(/\s+/)[0] ?? 'there';
  const attendanceRate30d = Math.round((stats.activeDays30d / 30) * 100);
  // TODO: Replace with real consecutive class attendance streak when available
  const currentStreak = 0;

  return (
    <section className="flex-1">
      <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-1 tracking-tight">
        {user.name ? t('welcomeWithName', { name: firstName }) : t('welcome')}
      </h1>
      <p className="text-sm text-muted-foreground mb-3">
        {t('subtitle')}
      </p>

      {params.joined === '1' && (
        <div className="mb-3 rounded-2xl border border-[#e5e7eb] bg-[#7daf41]/10 px-4 py-3 text-sm text-[#1f2937] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
              <Link href={withLocalePrefix('/dashboard/student/join')}>{t('classCard.cta')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* A) Quick stats — 3 columns on desktop */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex min-w-0 flex-col gap-0">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('avgScoreTitle')}
                </span>
                <p className="text-lg font-semibold text-gray-900 sm:text-xl">
                  {stats.avgScore30d != null ? `${stats.avgScore30d}%` : '—'}
                </p>
              </div>
              <PercentRing
                value={stats.avgScore30d}
                size={40}
                strokeWidth={4}
                fillColor="#429ead"
                className="shrink-0"
                aria-label={
                  stats.avgScore30d != null
                    ? t('avgScoreAria', { percent: stats.avgScore30d })
                    : t('avgScoreNotAvailable')
                }
              />
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex min-w-0 flex-col gap-0">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('attendanceTitle')}
                </span>
                <p className="text-lg font-semibold text-gray-900 sm:text-xl">
                  {attendanceRate30d}%
                </p>
              </div>
              <ProgressBar
                value={attendanceRate30d}
                aria-label={t('attendanceAria', { percent: attendanceRate30d })}
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex min-w-0 flex-col gap-0">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('streakTitle')}
                </span>
                <p className="text-lg font-semibold text-gray-900 sm:text-xl" aria-label={t('streakAria', { count: currentStreak })}>
                  {t('streakValue', { count: currentStreak })}
                </p>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {t('streakSupportingText')}
                </span>
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50"
                aria-hidden
              >
                <Flame className="h-5 w-5 text-amber-600" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* B) Next class — full-width hero strip (brand green #7daf41) */}
          <div className="mt-4">
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full rounded-xl border border-[#6a9538] px-6 py-4 text-white shadow-sm"
              style={{ backgroundColor: '#7daf41' }}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/90 uppercase tracking-wide">
                  {t('nextClassTitle')}
                  {data.nextSessions.length > 0 &&
                    isToday(new Date(data.nextSessions[0].session.startsAt)) && (
                      <span className="ml-2 normal-case">— {t('nextClassToday')}</span>
                    )}
                </p>
                {data.nextSessions.length === 0 ? (
                  <p className="text-sm text-white/90 mt-0.5">{t('nextClassEmpty')}</p>
                ) : (
                  <>
                    <p className="font-medium text-white mt-1">
                      {data.nextSessions[0].session.title ?? data.nextSessions[0].className}
                    </p>
                    <p className="text-sm text-white/90 mt-0.5">
                      {data.nextSessions[0].className} ·{' '}
                      <FormattedDateTimeRange
                        start={data.nextSessions[0].session.startsAt}
                        end={data.nextSessions[0].session.endsAt}
                        serverFallback={viewerTimezone}
                      />
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {data.nextSessions.length > 0 && data.nextSessions[0].session.meetingUrl ? (
                  <Button
                    size="sm"
                    className="rounded-full bg-white text-[#1f2937] hover:bg-white/90 border-0"
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
                ) : data.nextSessions.length > 0 ? (
                  <Button
                    size="sm"
                    className="rounded-full bg-white/10 text-white border border-white/40 cursor-not-allowed"
                    disabled
                  >
                    {t('nextClassJoinMeetingDisabled')}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full bg-white/10 text-white border-white/40 hover:bg-white/20"
                  asChild
                >
                  <Link href={withLocalePrefix(`/classroom/${data.primaryClass.id}`)} className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {t('nextClassOpenClassroom')}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* C) Remaining cards — 2-col grid, equal-height rows */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch mt-6">
            {/* Class updates — white card with color-coded rows by type (spans full width when no Needs attention) */}
            <div className={`h-full ${!hasNeedsAttention ? 'lg:col-span-2' : ''}`}>
              <Card className="h-full flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                    <Megaphone className="h-4 w-4 text-gray-600" aria-hidden />
                    {t('classUpdatesTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 p-6 pt-0">
                  {classFeedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">{t('classUpdatesEmpty')}</p>
                  ) : (
                    <ul className="space-y-2 flex-1">
                      {classFeedItems.map((post) => {
                        const type = (post.type in FEED_TYPE_ICONS ? post.type : 'document') as keyof typeof FEED_TYPE_ICONS;
                        const Icon = FEED_TYPE_ICONS[type] ?? FileText;
                        const label = post.title ?? FEED_TYPE_LABELS[post.type] ?? post.type;
                        const quizHref = post.type === 'quiz' && post.quizId ? `/learning/${post.quizId}` : null;
                        const homeworkHref = post.type === 'homework' ? '/dashboard/student/homework' : null;
                        const href = quizHref ?? homeworkHref ?? `/classroom/${data.primaryClass.id}`;
                        const localeHref = withLocalePrefix(href);
                        return (
                          <li key={post.id}>
                            <Link
                              href={localeHref}
                              className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3 bg-gray-50 transition hover:bg-gray-100 hover:shadow-sm hover:-translate-y-[1px]"
                            >
                              <Icon className="h-4 w-4 shrink-0" style={{ color: CLASS_UPDATE_ICON_COLOR }} aria-hidden />
                              <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{label}</span>
                              <div className="ml-auto flex shrink-0 items-center gap-3">
                                <span className="whitespace-nowrap text-sm text-muted-foreground">
                                  {formatFeedTime(new Date(post.createdAt))}
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Link
                    href={withLocalePrefix(`/classroom/${data.primaryClass.id}`)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {t('viewAllUpdates')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Needs attention — white card like others, tinted rows (right column) */}
            {hasNeedsAttention && (
              <div className="h-full">
                <Card className="h-full flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base text-gray-900">
                      <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: GECKO_COLORS.alert }} aria-hidden />
                      {t('needsAttentionTitle')}
                      {needsAttention.incompleteQuizzes.length > 0 && (
                        <span
                          className="ml-2 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: GECKO_COLORS.alertTint, color: GECKO_COLORS.alert }}
                        >
                          {t('needsAttentionBadgeCount', { count: needsAttention.incompleteQuizzes.length })}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 p-6 pt-0">
                    {needsAttention.incompleteQuizzes.length === 0 && !needsAttention.noActivityIn7Days ? (
                      <p className="text-sm text-muted-foreground py-1">{t('needsAttentionAllCaughtUp')}</p>
                    ) : (
                      <>
                        {needsAttention.incompleteQuizzes.length > 0 && (
                        <ul className="space-y-2 flex-1">
                          {needsAttention.incompleteQuizzes.slice(0, 3).map((q) => (
                            <li key={q.quizId}>
                              <Link
                                href={withLocalePrefix(`/learning/${q.quizId}`)}
                                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3 bg-gray-50 transition hover:bg-gray-100 hover:shadow-sm hover:-translate-y-[1px]"
                              >
                                <ClipboardList className="h-4 w-4 shrink-0" style={{ color: GECKO_COLORS.alert }} aria-hidden />
                                <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                                  {q.quizTitle}
                                  {q.className && <span className="text-muted-foreground"> ({q.className})</span>}
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                              </Link>
                            </li>
                          ))}
                        </ul>
                        )}
                        {needsAttention.noActivityIn7Days && (
                          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: GECKO_COLORS.alert }} aria-hidden />
                            {t('needsAttentionNoActivity')}
                          </p>
                        )}
                        {(needsAttention.incompleteQuizzes.length > 0 || needsAttention.noActivityIn7Days) && (
                          <Link
                            href={withLocalePrefix('/dashboard/student/learning')}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            {t('needsAttentionViewAll')}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Attendance this month — full width */}
            <div className="h-full lg:col-span-2">
              <div className="h-full [&>div]:h-full [&_.rounded-2xl]:rounded-xl [&_[data-slot=card-header]]:p-6 [&_[data-slot=card-header]]:pb-2 [&_[data-slot=card-content]]:p-6 [&_[data-slot=card-content]]:pt-0 [&_[data-slot=card-content]]:space-y-2 [&_.h-16]:h-10">
                <StudentAttendanceMonthCard
                  attendanceRate={attendanceSummary.attendanceRate}
                  presentCount={attendanceSummary.presentCount}
                  lateCount={attendanceSummary.lateCount}
                  absentCount={attendanceSummary.absentCount}
                  participationAvg={attendanceSummary.participationAvg}
                  title={tCommon('thisMonth')}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
