'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormattedDateTime } from '@/components/display/FormattedDateTime';
import { CountdownTimer } from './CountdownTimer';
import { Calendar, Video } from 'lucide-react';
import type { TeacherNextSession } from '@/lib/db/queries/teacher-dashboard';

type Props = {
  nextSession: TeacherNextSession | null;
  viewerTimezone: string;
};

export function NextClassCard({ nextSession, viewerTimezone }: Props) {
  const t = useTranslations('teacher.dashboard');

  if (!nextSession) {
    return (
      <Card className="border-[#e5e7eb] bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#429ead]" aria-hidden />
            <h2 className="text-base font-semibold text-[#1f2937]">
              {t('nextClass')}
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-2">
            {t('noUpcomingSessions')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const startsAt = new Date(nextSession.startsAt);
  const within60Min = startsAt.getTime() - Date.now() <= 60 * 60 * 1000;

  return (
    <Card
      className={`${
        within60Min
          ? 'border-2 border-[#429ead] bg-[#429ead]/5'
          : 'border-[#e5e7eb] bg-white'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#429ead]" aria-hidden />
            <h2 className="text-base font-semibold text-[#1f2937]">
              {t('nextClass')}
            </h2>
          </div>
          <div
            className="tabular-nums text-lg font-semibold text-[#429ead]"
            aria-live="polite"
          >
            <CountdownTimer targetAt={nextSession.startsAt} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Link
            href={`/classroom/${nextSession.classId}`}
            className="font-medium text-primary hover:underline"
          >
            {nextSession.title ?? nextSession.className}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            {nextSession.geckoLevel && (
              <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                {nextSession.geckoLevel}
              </span>
            )}
            <FormattedDateTime
              date={nextSession.startsAt}
              serverFallback={viewerTimezone}
              dateOptions={{ weekday: 'short', month: 'short', day: 'numeric' }}
              timeOptions={{ hour: 'numeric', minute: '2-digit' }}
            />
            {nextSession.studentCount > 0 && (
              <span>{t('studentCount', { count: nextSession.studentCount })}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" asChild>
            <Link href={`/classroom/${nextSession.classId}`}>
              <Video className="mr-1.5 h-4 w-4" />
              {t('openClassroom')}
            </Link>
          </Button>
          {nextSession.meetingUrl && (
            <Button variant="secondary" size="sm" asChild>
              <a
                href={nextSession.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('join')}
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/teacher/schedule">{t('viewSchedule')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
