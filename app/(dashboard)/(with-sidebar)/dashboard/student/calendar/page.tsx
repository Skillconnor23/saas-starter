export const dynamic = 'force-dynamic';

import { requireRole } from '@/lib/auth/user';
import { getOccurrencesForUser } from '@/lib/schedule';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import { ViewerTimezoneLabel } from '@/components/display/ViewerTimezoneLabel';
import { SetTimezoneOnMount } from '@/components/calendar/SetTimezoneOnMount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const DEFAULT_DAYS = 30;

export default async function StudentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await requireRole(['student']);
  const params = await searchParams;
  const days = Math.min(30, Math.max(7, parseInt(params.days ?? String(DEFAULT_DAYS), 10) || DEFAULT_DAYS));

  const now = new Date();
  const rangeEnd = new Date(now.getTime() + days * 86400000);
  const occurrences = await getOccurrencesForUser(
    user.id,
    'student',
    now,
    rangeEnd
  );
  const viewerTimezone = user.timezone ?? 'UTC';

  return (
    <section className="flex-1 p-4 lg:p-8">
      {user.timezone === null && <SetTimezoneOnMount />}
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-lg lg:text-2xl font-medium mb-6 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Calendar
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming classes</CardTitle>
            <p className="text-sm text-muted-foreground">
              <ViewerTimezoneLabel
                serverFallback={viewerTimezone}
                template={`Next ${days} days · your timezone: {tz}`}
              />
            </p>
          </CardHeader>
          <CardContent>
            <CalendarListView
              occurrences={occurrences}
              viewerTimezone={viewerTimezone}
              daysLabel={`Next ${days} days`}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
