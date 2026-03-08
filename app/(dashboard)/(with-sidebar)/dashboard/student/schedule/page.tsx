export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getCalendarEventsForStudent } from '@/lib/schedule/calendar-events';
import { SetTimezoneOnMount } from '@/components/calendar/SetTimezoneOnMount';
import { CalendarDays } from 'lucide-react';
import { ViewerTimezoneLabel } from '@/components/display/ViewerTimezoneLabel';
import { StudentScheduleClient } from './StudentScheduleClient';

export default async function StudentSchedulePage() {
  const t = await getTranslations('schedule');
  const tSidebar = await getTranslations('dashboard.sidebar.student');
  const user = await requireRole(['student']);
  const viewerTimezone = user.timezone ?? 'UTC';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const rangeEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [monthEvents, upcomingRaw] = await Promise.all([
    getCalendarEventsForStudent(user.id, monthStart, monthEnd),
    getCalendarEventsForStudent(user.id, now, rangeEnd),
  ]);

  const upcomingEvents = upcomingRaw
    .filter((e) => e.startsAt >= now)
    .slice(0, 10)
    .map((e) => ({
      ...e,
      id: `${e.classId}-${e.startsAt.toISOString()}`,
    }));

  const monthEventsWithId = monthEvents.map((e) => ({
    ...e,
    id: `${e.classId}-${e.startsAt.toISOString()}`,
  }));

  return (
    <section className="flex h-full flex-col">
      {user.timezone === null && <SetTimezoneOnMount />}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <header className="flex flex-col gap-1 mb-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-xl lg:text-2xl font-medium tracking-tight">
                {tSidebar('schedule')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              <ViewerTimezoneLabel
                serverFallback={viewerTimezone}
                template={t('yourTimezone', { tz: '{tz}' })}
              />
            </p>
          </header>

          <StudentScheduleClient
            initialMonthEvents={monthEventsWithId.map((e) => ({
              ...e,
              startsAt: e.startsAt instanceof Date ? e.startsAt.toISOString() : String(e.startsAt),
              endsAt: e.endsAt instanceof Date ? e.endsAt.toISOString() : String(e.endsAt),
            }))}
            upcomingEvents={upcomingEvents.map((e) => ({
              ...e,
              startsAt: e.startsAt instanceof Date ? e.startsAt.toISOString() : String(e.startsAt),
              endsAt: e.endsAt instanceof Date ? e.endsAt.toISOString() : String(e.endsAt),
            }))}
            viewerTimezone={viewerTimezone}
          />
        </div>
      </div>
    </section>
  );
}
