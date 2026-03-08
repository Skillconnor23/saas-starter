'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { BookOpen, UsersRound, ClipboardCheck } from 'lucide-react';
import { ClientScheduleSummary } from '@/app/(dashboard)/(with-sidebar)/dashboard/teacher/ClientScheduleSummary';
import type { ClassHealthRow } from '@/lib/db/queries/education';

function formatNextSession(
  at: Date | null,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  if (!at) return t('noUpcomingSession');
  const d = new Date(at);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (isToday) return `${t('today')} ${timeStr}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) {
    return `${t('tomorrow')} ${timeStr}`;
  }
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isActiveToday(nextAt: Date | null): boolean {
  if (!nextAt) return false;
  const d = new Date(nextAt);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

type Filter = 'all' | 'needs_attention' | 'active_today';

type Props = {
  classes: ClassHealthRow[];
  viewerTimezone: string;
  attendanceNeededByClass: Map<string, { sessionId: string }>;
};

export function TeacherClassCards({
  classes,
  viewerTimezone,
  attendanceNeededByClass,
}: Props) {
  const t = useTranslations('teacher.classes');
  const [filter, setFilter] = useState<Filter>('all');

  const needsAttention = (c: ClassHealthRow): boolean => {
    const hasAttendanceNeeded = attendanceNeededByClass.has(c.id);
    const noStudents = c.studentCount === 0;
    const noUpcoming = c.nextSessionAt === null;
    return hasAttendanceNeeded || noStudents || noUpcoming;
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return classes;
    if (filter === 'needs_attention') return classes.filter(needsAttention);
    if (filter === 'active_today') return classes.filter((c) => isActiveToday(c.nextSessionAt));
    return classes;
  }, [classes, filter, attendanceNeededByClass]);

  if (classes.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t('noClassesYet')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { value: 'all' as const, labelKey: 'filterAll' as const },
            { value: 'needs_attention' as const, labelKey: 'filterNeedsAttention' as const },
            { value: 'active_today' as const, labelKey: 'filterActiveToday' as const },
          ] as const
        ).map(({ value, labelKey }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-2.5 py-1 text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-[#429ead] text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
        <span className="text-xs text-muted-foreground">
          {t('ofClasses', { filtered: filtered.length, total: classes.length })}
        </span>
      </div>

      {/* Class cards — compact grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const attendance = attendanceNeededByClass.get(c.id);
          const hasAttendanceNeeded = !!attendance;
          const isToday = isActiveToday(c.nextSessionAt);

          return (
            <div
              key={c.id}
              className={`flex flex-col rounded-lg border bg-white p-3 transition-colors hover:border-[#429ead]/40 ${
                hasAttendanceNeeded ? 'border-amber-400/70' : 'border-[#e5e7eb]'
              }`}
            >
              {/* Top row: name + level + status badge only when meaningful */}
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1f2937]">
                  {c.name}
                </h3>
                {c.geckoLevel && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    {c.geckoLevel}
                  </span>
                )}
                {hasAttendanceNeeded && (
                  <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                    {t('attendanceNeeded')}
                  </span>
                )}
                {!hasAttendanceNeeded && isToday && (
                  <span className="shrink-0 rounded bg-[#429ead]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#429ead]">
                    {t('nextClassToday')}
                  </span>
                )}
              </div>

              {/* Middle: single status line — schedule · students · next session (or "No upcoming session" once) */}
              <p className="mt-1.5 text-xs text-muted-foreground">
                <ClientScheduleSummary
                  classData={{
                    scheduleDays: c.scheduleDays,
                    scheduleStartTime: c.scheduleStartTime,
                    scheduleTimezone: c.scheduleTimezone,
                    geckoLevel: null,
                  }}
                  serverTimezoneFallback={viewerTimezone}
                  referenceDate={c.nextSessionAt ?? undefined}
                />
                <span className="text-muted-foreground/70"> · </span>
                {t('student', { count: c.studentCount })}
                <span className="text-muted-foreground/70"> · </span>
                {formatNextSession(c.nextSessionAt, t)}
              </p>

              {/* Bottom: actions */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hasAttendanceNeeded && attendance && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 rounded-md bg-amber-600 px-2.5 text-xs hover:bg-amber-700"
                    asChild
                  >
                    <Link href={`/classroom/${c.id}/attendance?session=${attendance.sessionId}`}>
                      <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
                      {t('takeAttendance')}
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-md px-2.5 text-xs"
                  asChild
                >
                  <Link href={`/classroom/${c.id}/people`}>
                    <UsersRound className="mr-1 h-3.5 w-3.5" />
                    {t('roster')}
                  </Link>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-7 rounded-md px-2.5 text-xs"
                  asChild
                >
                  <Link href={`/classroom/${c.id}`}>
                    <BookOpen className="mr-1 h-3.5 w-3.5" />
                    {t('openClassroom')}
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && filter !== 'all' && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t('noClassesMatchFilter')}
        </p>
      )}
    </div>
  );
}
