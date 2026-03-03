'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SessionWithCompletion = {
  id: string;
  startsAt: Date;
  isCompleted: boolean;
  isIncompletePast: boolean;
};

type Props = {
  classId: string;
  sessions: SessionWithCompletion[];
  currentSessionId: string;
  classTimezone: string;
  isCompleted: boolean;
  rosterCount: number;
};

/** e.g. "Sat, Mar 7, 2026 — 09:00" */
function formatSessionDisplay(d: Date, timezone: string): string {
  const dt = new Date(d);
  const dateStr = dt.toLocaleDateString(undefined, {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = dt.toLocaleTimeString(undefined, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateStr} — ${timeStr}`;
}

function isSessionToday(startsAt: Date, timezone: string): boolean {
  const todayInTz = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  const sessionDateInTz = new Date(startsAt).toLocaleDateString('en-CA', {
    timeZone: timezone,
  });
  return todayInTz === sessionDateInTz;
}

export function SessionSelector({
  classId,
  sessions,
  currentSessionId,
  classTimezone,
  isCompleted,
  rosterCount,
}: Props) {
  const router = useRouter();
  const tz = classTimezone || 'UTC';

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const currentIndex = sortedSessions.findIndex((s) => s.id === currentSessionId);
  const currentSession = currentIndex >= 0 ? sortedSessions[currentIndex] : null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < sortedSessions.length - 1;

  const prevSession = hasPrev ? sortedSessions[currentIndex - 1]! : null;
  const nextSession = hasNext ? sortedSessions[currentIndex + 1]! : null;

  function goToSession(sessionId: string) {
    router.push(`/classroom/${classId}/attendance?session=${sessionId}`);
  }

  if (sessions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5">
      {/* Left arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={!hasPrev}
        onClick={() => prevSession && goToSession(prevSession.id)}
        aria-label="Previous session"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Session date/time — large, readable */}
      <div className="flex items-center gap-2 min-w-0 flex-1 basis-0">
        <span className="text-lg font-medium truncate">
          {currentSession
            ? formatSessionDisplay(currentSession.startsAt, tz)
            : '—'}
        </span>
        {currentSession && isSessionToday(currentSession.startsAt, tz) && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Today
          </span>
        )}
      </div>

      {/* Right arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={!hasNext}
        onClick={() => nextSession && goToSession(nextSession.id)}
        aria-label="Next session"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Class timezone (muted) */}
      <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
        {tz}
      </span>

      {/* Clock icon — dropdown of sessions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Choose session"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[320px] min-w-[240px]">
          {sortedSessions
            .slice()
            .reverse()
            .map((s) => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => goToSession(s.id)}
                className={cn(
                  'flex items-center gap-2',
                  s.id === currentSessionId && 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    s.isCompleted && 'bg-brand-primary',
                    s.isIncompletePast && !s.isCompleted && 'bg-brand-accent'
                  )}
                />
                <span className="truncate">
                  {formatSessionDisplay(s.startsAt, tz)}
                </span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Completed badge (only when every student has a status) */}
      {rosterCount > 0 && isCompleted && (
        <span className="shrink-0 rounded-full bg-brand-primary/15 px-2.5 py-0.5 text-xs font-medium text-brand-primary">
          Completed
        </span>
      )}
      {rosterCount > 0 && !isCompleted && currentSession?.isIncompletePast && (
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          In progress
        </span>
      )}
    </div>
  );
}
