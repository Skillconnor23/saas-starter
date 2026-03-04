export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireClassroomAccess, canPostToClassroom } from '@/lib/auth/classroom';
import { listClassroomPosts } from '@/lib/db/queries/education';
import { getClassroomSidebarData } from '@/lib/db/queries/classroom';
import { getClassMonthSummary } from '@/lib/db/queries/attendance';
import { ClassAttendanceMonthCard } from '@/components/attendance/AttendanceMonthSummaryCard';
import { ClassroomFeed } from './classroom-feed';
import { ClassScoreCard } from './ClassScoreCard';
import { TeacherCard } from './TeacherCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, ClipboardList } from 'lucide-react';
import { AddPostMenu } from '@/components/classroom/AddPostMenu';

type Props = { params: Promise<{ classId: string }> };

export default async function ClassroomPage({ params }: Props) {
  const t = await getTranslations('classroom');
  const { classId } = await params;
  const { user, eduClass } = await requireClassroomAccess(classId);

  const [posts, canPost, sidebar, classMonthSummary] = await Promise.all([
    listClassroomPosts(classId, 50),
    canPostToClassroom(user, classId),
    getClassroomSidebarData(classId),
    getClassMonthSummary({ classId }),
  ]);

  return (
    <section className="flex flex-col p-6 lg:p-10 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col lg:min-h-0">
        {/* Header - Back link + class title + People (no sticky to avoid ghost overlay) */}
        <div className="shrink-0 border-b border-[#e5e7eb] bg-white pb-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t('backToDashboard')}
            </Link>
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {eduClass.name}
              </h2>
              {(eduClass.geckoLevel ?? eduClass.level) && (
                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {eduClass.geckoLevel ?? eduClass.level}
                </span>
              )}
            </div>
            {eduClass.timezone && (
              <p className="mt-1 text-sm text-muted-foreground">{eduClass.timezone}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/classroom/${classId}/people`} className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {t('people')}
              </Link>
            </Button>
            {canPost && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/classroom/${classId}/attendance`}
                  className="flex items-center gap-1.5"
                >
                  <ClipboardList className="h-4 w-4" />
                  {t('attendance')}
                </Link>
              </Button>
            )}
            {canPost && <AddPostMenu classId={classId} />}
          </div>
        </div>
        </div>

        {/* Content grid: scrollable left col (lg only) + sticky right sidebar */}
        <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left column - scrollable on desktop only */}
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8 lg:min-h-0 lg:overflow-y-auto lg:pr-2 lg:pt-6">
            <div
              className="flex h-24 shrink-0 items-center rounded-2xl border border-[#e5e7eb] bg-[#7daf41] px-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:h-[120px]"
              aria-hidden
            >
              <span className="text-sm font-medium text-white/90">Week overview</span>
            </div>
            <Card className="shrink-0 rounded-2xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <CardHeader>
                <CardTitle>Classroom feed</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Materials, recordings, and announcements from your teacher.
                </p>
              </CardHeader>
              <CardContent>
                <ClassroomFeed
                  classId={classId}
                  initialPosts={posts}
                  canPost={canPost}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar - sticky on desktop */}
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-0 lg:self-start">
            {canPost && (
              <ClassAttendanceMonthCard
                attendanceRate={classMonthSummary.attendanceRate}
                lateRate={classMonthSummary.lateRate}
                participationAvg={classMonthSummary.participationAvg}
                totalSessionsHeld={classMonthSummary.totalSessionsHeld}
                detailsHref={`/classroom/${classId}/attendance`}
              />
            )}
            <ClassScoreCard
              classAverage30d={sidebar.classAverage30d}
              attemptRate30d={sidebar.attemptRate30d}
              lastActivity={sidebar.lastActivity}
            />
            {sidebar.teacher && (
              <TeacherCard teacher={sidebar.teacher} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
