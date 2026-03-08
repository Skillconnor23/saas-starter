'use client';

import Link from 'next/link';
import type { Occurrence } from '@/lib/schedule';
import { useViewerTimezone } from '@/lib/hooks/use-viewer-timezone';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

type Props = {
  occurrences: Occurrence[];
  viewerTimezone: string;
  daysLabel?: string;
  /** Optional translated empty state message */
  emptyMessage?: string;
};

function formatDateKey(d: Date | string, tz: string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-CA', { timeZone: tz });
}

function formatTime(d: Date | string, tz: string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleTimeString(undefined, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateHeading(d: Date | string, tz: string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function CalendarListView({
  occurrences,
  viewerTimezone,
  daysLabel = 'Upcoming',
  emptyMessage = 'No classes scheduled in this range.',
}: Props) {
  const tz = useViewerTimezone(viewerTimezone || 'UTC');
  const byDate = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const key = formatDateKey(o.startsAt, tz);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(o);
  }
  const sortedDates = Array.from(byDate.keys()).sort();

  if (occurrences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{daysLabel}</p>
      {sortedDates.map((dateKey) => {
        const items = byDate.get(dateKey)!;
        const firstStart = items[0]!.startsAt;

        return (
          <div key={dateKey}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {formatDateHeading(firstStart, tz)}
            </h3>
            <ul className="space-y-2">
              {items.map((o) => (
                <li
                  key={`${o.classId}-${typeof o.startsAt === 'string' ? o.startsAt : o.startsAt.toISOString()}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <span className="text-sm font-medium tabular-nums">
                    {formatTime(o.startsAt, tz)}
                  </span>
                  <span className="font-medium">{o.className}</span>
                  {o.geckoLevel && (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                      {o.geckoLevel}
                    </span>
                  )}
                  <span className="flex-1" />
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
          </div>
        );
      })}
    </div>
  );
}
