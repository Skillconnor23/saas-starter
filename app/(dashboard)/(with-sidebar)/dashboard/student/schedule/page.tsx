export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getCalendarEventsForStudent } from '@/lib/schedule/calendar-events';
import { MonthCalendar } from '@/components/schedule/MonthCalendar';
import { SetTimezoneOnMount } from '@/components/calendar/SetTimezoneOnMount';
import { CalendarDays } from 'lucide-react';

export default async function StudentSchedulePage() {
  const t = await getTranslations('schedule');
  const tSidebar = await getTranslations('dashboard.sidebar.student');
  const user = await requireRole(['student']);
  const viewerTimezone = user.timezone ?? 'UTC';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const calendarEvents = await getCalendarEventsForStudent(
    user.id,
    monthStart,
    monthEnd
  );

  return (
    <section className="flex h-full flex-col">
      {user.timezone === null && <SetTimezoneOnMount />}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <header className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6" />
              <h1 className="text-lg lg:text-2xl font-medium">{tSidebar('schedule')}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('yourTimezone', { tz: viewerTimezone })}
            </p>
          </header>

          <MonthCalendar
            initialMonthStart={monthStart.toISOString()}
            initialMonthEnd={monthEnd.toISOString()}
            initialEvents={calendarEvents.map((e) => ({
              ...e,
              startsAt: e.startsAt.toISOString(),
              endsAt: e.endsAt.toISOString(),
            }))}
            viewerTimezone={viewerTimezone}
          />
        </div>
      </div>
    </section>
  );
}
