'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { BookOpen, UsersRound } from 'lucide-react';
import type { ClassHealthRow } from '@/lib/db/queries/education';

const DAY_DISPLAY: Record<string, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed',
  thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

function formatScheduleSummary(c: ClassHealthRow): string {
  const days = Array.isArray(c.scheduleDays)
    ? (c.scheduleDays as string[]).map((d) =>
        DAY_DISPLAY[d?.toLowerCase?.().slice(0, 3)] ?? d
      ).filter(Boolean)
    : [];
  const time = c.scheduleStartTime ?? '—';
  const level = c.geckoLevel ?? '';
  const parts = [days.length ? days.join(' & ') : null, time, level].filter(Boolean);
  return parts.join(' · ') || '—';
}

function formatNextSession(
  at: Date | null,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  if (!at) return t('noUpcomingSession');
  const d = new Date(at);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (isToday) {
    return `${t('today')} ${timeStr}`;
  }
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

function needsAttention(c: ClassHealthRow): boolean {
  return c.studentCount === 0 || c.nextSessionAt === null;
}

type Filter = 'all' | 'needs_attention' | 'active_today';

export function ClassHealthCards({ classes }: { classes: ClassHealthRow[] }) {
  const t = useTranslations('teacher.classes');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return classes;
    if (filter === 'needs_attention') return classes.filter(needsAttention);
    if (filter === 'active_today') return classes.filter((c) => isActiveToday(c.nextSessionAt));
    return classes;
  }, [classes, filter]);

  if (classes.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t('noClassesYet')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
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
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-[#429ead] text-white'
                : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
        <span className="ml-2 self-center text-xs text-muted-foreground">
          {t('ofClasses', { filtered: filtered.length, total: classes.length })}
        </span>
      </div>

      {/* Class cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="flex flex-col rounded-2xl border border-[#e5e7eb] bg-white p-5 transition-colors hover:border-[#e5e7eb]/80"
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-medium text-[#1f2937]">{c.name}</h3>
              {c.geckoLevel && (
                <span className="inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {c.geckoLevel}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {formatScheduleSummary(c)}
            </p>

            {/* Status indicators */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{t('student', { count: c.studentCount })}</span>
              <span>{formatNextSession(c.nextSessionAt, t)}</span>
              {(c.quizCount > 0 || c.homeworkCount > 0) && (
                <span>
                  {[c.quizCount > 0 && t('quiz', { count: c.quizCount })]
                    .filter(Boolean)
                    .concat(
                      c.homeworkCount > 0
                        ? [t('homework', { count: c.homeworkCount })]
                        : []
                    )
                    .join(' · ')}
                </span>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href={`/classroom/${c.id}/people`}>
                  <UsersRound className="mr-1.5 h-4 w-4" />
                  {t('roster')}
                </Link>
              </Button>
              <Button variant="primary" size="sm" asChild className="rounded-full bg-[#7daf41] hover:bg-[#6c9b38]">
                <Link href={`/classroom/${c.id}`}>
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  {t('openClassroom')}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && filter !== 'all' && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('noClassesMatchFilter')}
        </p>
      )}
    </div>
  );
}
