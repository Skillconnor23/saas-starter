'use client';

import Link from 'next/link';
import type { Occurrence } from '@/lib/schedule';
import { formatScheduleTimeInViewerTz } from '@/lib/schedule/tz';
import { useViewerTimezone } from '@/lib/hooks/use-viewer-timezone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink } from 'lucide-react';

type ScheduleSummaryRow = {
  id: string;
  name: string;
  geckoLevel: string | null;
  scheduleDays: unknown;
  scheduleStartTime: string | null;
  scheduleTimezone: string | null;
  durationMinutes: number | null;
  defaultMeetingUrl: string | null;
};

const DAY_DISPLAY: Record<string, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};
const DAY_NUM_TO_LABEL: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

function formatScheduleDays(days: unknown): string {
  if (!Array.isArray(days) || days.length === 0) return '—';
  const labels = days.map((d) => {
    if (typeof d === 'string') return DAY_DISPLAY[d.toLowerCase().slice(0, 3)] ?? d;
    if (typeof d === 'number' && d >= 0 && d <= 6) return DAY_NUM_TO_LABEL[d];
    return String(d);
  }).filter(Boolean);
  return labels.join(' & ');
}

function formatOccurrenceDate(d: Date, tz: string): string {
  return d.toLocaleDateString(undefined, {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function formatOccurrenceTimeRange(starts: Date, ends: Date, tz: string): string {
  const start = starts.toLocaleTimeString(undefined, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const end = ends.toLocaleTimeString(undefined, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${start} – ${end}`;
}

type Props = {
  classes: ScheduleSummaryRow[];
  nextOccurrences: Occurrence[];
  viewerTimezone: string;
};

export function ScheduleView({ classes, nextOccurrences, viewerTimezone }: Props) {
  const tz = useViewerTimezone(viewerTimezone || 'UTC');

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Your timezone: {tz}
      </p>

      {/* My Classes */}
      <Card>
        <CardHeader>
          <CardTitle>My classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes.</p>
          ) : (
            classes.map((c) => {
              const hasSchedule = Array.isArray(c.scheduleDays) && c.scheduleDays.length > 0 && c.scheduleStartTime;
              const classTz = c.scheduleTimezone ?? 'Asia/Ulaanbaatar';
              const tzDiff = classTz !== tz;
              const dur = c.durationMinutes ?? 50;
              const nextOcc = nextOccurrences.find((o) => o.classId === c.id);
              const refDate = nextOcc?.startsAt ?? undefined;

              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{c.name}</span>
                      {c.geckoLevel && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                          {c.geckoLevel}
                        </span>
                      )}
                    </div>
                    {hasSchedule ? (
                      <p className="text-sm text-muted-foreground">
                        {formatScheduleDays(c.scheduleDays)} •{' '}
                        {formatScheduleTimeInViewerTz(c.scheduleStartTime, classTz, tz, refDate)} (your time) • {dur} min
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No recurring schedule set
                      </p>
                    )}
                    {tzDiff && hasSchedule && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Class time: {formatScheduleTimeInViewerTz(c.scheduleStartTime, classTz, classTz, refDate)} {classTz}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/classroom/${c.id}`}
                      className="inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open classroom
                    </Link>
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Next classes */}
      <Card>
        <CardHeader>
          <CardTitle>Next classes</CardTitle>
          <p className="text-sm text-muted-foreground">Upcoming sessions</p>
        </CardHeader>
        <CardContent>
          {nextOccurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming classes in the next 30 days.
            </p>
          ) : (
            <ul className="space-y-3">
              {nextOccurrences.map((o) => (
                <li
                  key={`${o.classId}-${o.startsAt.toISOString()}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-4"
                >
                  <div>
                    <p className="text-sm font-medium tabular-nums text-muted-foreground">
                      {formatOccurrenceDate(o.startsAt, tz)} ·{' '}
                      {formatOccurrenceTimeRange(o.startsAt, o.endsAt, tz)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{o.className}</span>
                      {o.geckoLevel && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                          {o.geckoLevel}
                        </span>
                      )}
                    </div>
                  </div>
                  {o.meetingUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={o.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/classroom/${o.classId}`}>Open</Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
