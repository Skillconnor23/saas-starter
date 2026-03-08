export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getOccurrencesForUser } from '@/lib/schedule';
import { getClassesWithScheduleForCalendar } from '@/lib/db/queries/education';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import { ViewerTimezoneLabel } from '@/components/display/ViewerTimezoneLabel';
import { SetTimezoneOnMount } from '@/components/calendar/SetTimezoneOnMount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { CalendarFilterForm } from './CalendarFilterForm';

const DEFAULT_DAYS = 30;

export default async function TeacherCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; classId?: string }>;
}) {
  const user = await requireRole(['teacher']);
  const t = await getTranslations('teacher.calendar');
  const params = await searchParams;
  const days = Math.min(30, Math.max(7, parseInt(params.days ?? String(DEFAULT_DAYS), 10) || DEFAULT_DAYS));
  const classIdFilter = params.classId ?? null;

  const [classes, occurrences] = await Promise.all([
    getClassesWithScheduleForCalendar(user.id, 'teacher'),
    (async () => {
      const now = new Date();
      const rangeEnd = new Date(now.getTime() + days * 86400000);
      return getOccurrencesForUser(user.id, 'teacher', now, rangeEnd, classIdFilter);
    })(),
  ]);

  const viewerTimezone = user.timezone ?? 'UTC';

  return (
    <section className="flex-1 p-4 lg:p-8">
      {user.timezone === null && <SetTimezoneOnMount />}
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-lg lg:text-2xl font-medium mb-6 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          {t('title')}
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>{t('upcomingClasses')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              <ViewerTimezoneLabel
                serverFallback={viewerTimezone}
                template={t('nextDaysTimezone', { days, timezone: '{tz}' })}
              />
            </p>
            {classes.length >= 1 && (
              <CalendarFilterForm
                classes={classes.map((c) => ({ id: c.id, name: c.name }))}
                currentClassId={classIdFilter}
                currentDays={days}
                classLabel={t('filterClass')}
                allClassesOption={t('filterAllClasses')}
                daysLabel={t('filterDays')}
                option14={t('days14')}
                option30={t('days30')}
              />
            )}
          </CardHeader>
          <CardContent>
            <CalendarListView
              occurrences={occurrences}
              viewerTimezone={viewerTimezone}
              daysLabel={t('nextDaysLabel', { days })}
              emptyMessage={t('emptyRange')}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
