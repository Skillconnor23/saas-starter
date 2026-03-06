'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronRight, NotebookPen } from 'lucide-react';
import { GECKO_COLORS } from '@/lib/constants/colors';

type HomeworkItem = {
  homework: {
    id: string;
    title: string;
    dueDate: Date | string | null;
  };
  className: string | null;
  submission: {
    submittedAt: Date | string;
    score: number | null;
  } | null;
};

type Filter = 'all' | 'due' | 'completed';

function getStatus(
  item: HomeworkItem
): 'late' | 'notSubmitted' | 'submitted' | 'graded' {
  const now = new Date();
  const dueDate = item.homework.dueDate ? new Date(item.homework.dueDate) : null;
  const isOverdue = dueDate && dueDate < now;
  const hasSubmission = !!item.submission;

  if (hasSubmission) {
    return item.submission!.score != null ? 'graded' : 'submitted';
  }
  if (isOverdue) return 'late';
  return 'notSubmitted';
}

function getDueRelativeText(
  dueDate: Date | string | null,
  t: (key: string, values?: Record<string, number | string>) => string
): string {
  if (!dueDate) return t('noDueDate');
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return t('overdueDays', { days: Math.abs(diffDays) });
  if (diffDays === 0) return t('dueToday');
  if (diffDays === 1) return t('dueTomorrow');
  return t('dueInDays', { days: diffDays });
}

type Props = {
  list: HomeworkItem[];
};

export function StudentHomeworkListClient({ list }: Props) {
  const t = useTranslations('homework');
  const tList = useTranslations('homework.listPage');
  const locale = useLocale();
  const withLocalePrefix = (path: string) => `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    let dueSoon = 0;
    let late = 0;
    let completed = 0;
    for (const item of list) {
      const status = getStatus(item);
      if (status === 'graded' || status === 'submitted') completed++;
      else if (status === 'late') late++;
      else {
        const due = item.homework.dueDate ? new Date(item.homework.dueDate) : null;
        if (due) {
          const now = new Date();
          const diffDays = Math.round((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          if (diffDays >= 0 && diffDays <= 7) dueSoon++;
        }
      }
    }
    return { dueSoon, late, completed };
  }, [list]);

  const filteredList = useMemo(() => {
    if (filter === 'all') return list;
    if (filter === 'completed') {
      return list.filter((item) => {
        const s = getStatus(item);
        return s === 'submitted' || s === 'graded';
      });
    }
    return list.filter((item) => {
      const s = getStatus(item);
      return s === 'notSubmitted' || s === 'late';
    });
  }, [list, filter]);

  const formatDueDate = (dueDate: Date | string | null) => {
    if (!dueDate) return null;
    return new Date(dueDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary chips + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-[#7daf41] text-white'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          {tList('filterAll')}
          {list.length > 0 && (
            <span className="ml-1.5 opacity-80">({list.length})</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setFilter('due')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'due'
              ? 'bg-[#7daf41] text-white'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          {tList('filterDue')}
          {(counts.dueSoon + counts.late) > 0 && (
            <span className="ml-1.5 opacity-80">
              ({counts.dueSoon + counts.late})
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-[#7daf41] text-white'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          {tList('filterCompleted')}
          {counts.completed > 0 && (
            <span className="ml-1.5 opacity-80">({counts.completed})</span>
          )}
        </button>
      </div>

      {/* Task card list */}
      <ul className="space-y-2">
        {filteredList.map((item) => {
          const status = getStatus(item);
          const statusLabel =
            status === 'late'
              ? tList('statusLate')
              : status === 'graded'
                ? tList('statusGraded')
                : status === 'submitted'
                  ? tList('statusSubmitted')
                  : tList('statusNotSubmitted');

          const statusPillStyle =
            status === 'graded' || status === 'submitted'
              ? { backgroundColor: '#7daf4120', color: '#7daf41' }
              : { backgroundColor: GECKO_COLORS.alertTint, color: GECKO_COLORS.alert };

          return (
            <li key={item.homework.id}>
              <div className="flex w-full items-center gap-4 rounded-lg border border-[#e5e7eb] px-4 py-3 bg-gray-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white">
                  <NotebookPen className="h-5 w-5" style={{ color: GECKO_COLORS.green }} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{item.homework.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {item.className && (
                      <span>{item.className}</span>
                    )}
                    <span>·</span>
                    <span>
                      {formatDueDate(item.homework.dueDate) ?? t('noDueDate')}
                    </span>
                    <span>·</span>
                    <span>{getDueRelativeText(item.homework.dueDate, tList)}</span>
                  </div>
                  <span
                    className="mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={statusPillStyle}
                  >
                    {status === 'graded' && item.submission?.score != null
                      ? `${statusLabel} — ${item.submission.score}%`
                      : statusLabel}
                  </span>
                </div>
                <Link
                  href={withLocalePrefix(`/dashboard/student/homework/${item.homework.id}`)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#429ead] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#388694] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#429ead]/50 focus-visible:ring-offset-2 active:opacity-90"
                >
                  {t('open')}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {filteredList.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {filter === 'all'
            ? t('noHomeworkYet')
            : filter === 'completed'
              ? tList('emptyFilterCompleted')
              : tList('emptyFilterDue')}
        </p>
      )}
    </div>
  );
}
