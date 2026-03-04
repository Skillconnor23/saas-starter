export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getScheduleSummaryForUser } from '@/lib/db/queries/education';
import { getNextOccurrencesForUser } from '@/lib/schedule';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { SetTimezoneOnMount } from '@/components/calendar/SetTimezoneOnMount';
import { CalendarDays } from 'lucide-react';

export default async function TeacherSchedulePage() {
  const user = await requireRole(['teacher']);
  const t = await getTranslations('teacher.schedule');
  const [classes, nextOccurrences] = await Promise.all([
    getScheduleSummaryForUser(user.id, 'teacher'),
    getNextOccurrencesForUser(user.id, 'teacher', 2),
  ]);
  const viewerTimezone = user.timezone ?? 'UTC';

  return (
    <section className="flex h-full flex-col gap-4">
      {user.timezone === null && <SetTimezoneOnMount />}
      <div className="flex items-center gap-2 shrink-0">
        <CalendarDays className="h-6 w-6" />
        <h1 className="text-lg lg:text-2xl font-medium">{t('title')}</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="mx-auto w-full max-w-3xl">
          <ScheduleView
            classes={classes}
            nextOccurrences={nextOccurrences}
            viewerTimezone={viewerTimezone}
          />
        </div>
      </div>
    </section>
  );
}
