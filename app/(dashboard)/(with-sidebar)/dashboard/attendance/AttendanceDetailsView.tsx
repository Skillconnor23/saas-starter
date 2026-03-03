'use client';

import { useState, useTransition } from 'react';
import {
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { StudentAttendanceMonthCard } from '@/components/attendance/AttendanceMonthSummaryCard';
import { getMonthAttendanceDetailsAction } from '@/lib/actions/attendance';
import type { StudentMonthSummary } from '@/lib/db/queries/attendance';
import type { MonthAttendanceDetails } from '@/lib/actions/attendance';
import { PARTICIPATION_MAX } from '@/lib/constants/attendance';

/** Session row (startsAt may be ISO string when passed from server). */
export type StudentMonthSessionRowClient = {
  sessionId: string;
  startsAt: Date | string;
  className: string | null;
  status: string | null;
  participationScore: number | null;
  teacherNote: string | null;
};

function formatPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
function formatAvg(v: number | null): string {
  if (v == null) return '—';
  return `${Number(v).toFixed(1)} / ${PARTICIPATION_MAX}`;
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatSessionDate(startsAt: Date | string): string {
  const d = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusPillClass(status: string | null): string {
  if (!status) return 'bg-muted text-muted-foreground';
  switch (status) {
    case 'present':
      return 'bg-[#7daf41]/15 text-[#7daf41]';
    case 'late':
      return 'bg-[#429ead]/15 text-[#429ead]';
    case 'absent':
      return 'bg-brand-warning/15 text-brand-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function DotStrip({ sessions }: { sessions: StudentMonthSessionRowClient[] }) {
  if (sessions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1" aria-label="Session attendance strip">
      {sessions.map((s) => {
        const status = s.status ?? 'unmarked';
        const dotClass =
          status === 'present'
            ? 'bg-[#7daf41]'
            : status === 'late'
              ? 'bg-[#429ead]'
              : status === 'absent'
                ? 'bg-brand-warning'
                : 'bg-muted';
        return (
          <span
            key={s.sessionId}
            className={`h-2 w-2 rounded-full ${dotClass}`}
            title={formatSessionDate(s.startsAt) + (s.status ? ` — ${s.status}` : '')}
          />
        );
      })}
    </div>
  );
}

function SessionHistoryTable({
  sessions,
  monthLabel,
}: {
  sessions: StudentMonthSessionRowClient[];
  monthLabel: string;
}) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No sessions in {monthLabel}.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-muted/30">
            <th className="text-left py-2 px-3 font-medium">Date & time</th>
            <th className="text-left py-2 px-3 font-medium">Class</th>
            <th className="text-left py-2 px-3 font-medium">Status</th>
            <th className="text-left py-2 px-3 font-medium">Participation</th>
            <th className="text-left py-2 px-3 font-medium min-w-[140px]">Note</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((row) => (
            <tr key={row.sessionId} className="border-b border-[#e5e7eb] last:border-0">
              <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                {formatSessionDate(row.startsAt)}
              </td>
              <td className="py-2 px-3">{row.className ?? '—'}</td>
              <td className="py-2 px-3">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${statusPillClass(row.status)}`}
                >
                  {row.status ?? '—'}
                </span>
              </td>
              <td className="py-2 px-3">
                {row.participationScore != null
                  ? `${row.participationScore} / ${PARTICIPATION_MAX}`
                  : '—'}
              </td>
              <td className="py-2 px-3 max-w-[200px]">
                {row.teacherNote ? (
                  <span
                    className="block truncate text-muted-foreground"
                    title={row.teacherNote}
                  >
                    {row.teacherNote}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type MonthSummary = StudentMonthSummary;

type Props = {
  currentMonthKey: string;
  currentSummary: MonthSummary;
  currentSessions: StudentMonthSessionRowClient[];
  previousMonthKeys: string[];
  previousSummaries: Record<string, MonthSummary>;
};

export function AttendanceDetailsView({
  currentMonthKey,
  currentSummary,
  currentSessions,
  previousMonthKeys,
  previousSummaries,
}: Props) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [loadedMonthData, setLoadedMonthData] = useState<
    Record<string, MonthAttendanceDetails>
  >({});
  const [isPending, startTransition] = useTransition();

  const currentMonthLabel = formatMonthLabel(currentMonthKey);

  function handleExpand(monthKey: string) {
    if (expandedMonth === monthKey) {
      setExpandedMonth(null);
      return;
    }
    setExpandedMonth(monthKey);
    if (!loadedMonthData[monthKey]) {
      startTransition(async () => {
        const result = await getMonthAttendanceDetailsAction(monthKey);
        if (result.success) {
          setLoadedMonthData((prev) => ({
            ...prev,
            [monthKey]: result.data,
          }));
        }
      });
    }
  }

  return (
    <section className="flex-1 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
          Attendance details
        </h1>
        <p className="text-sm text-muted-foreground">
          Monthly attendance summaries and history.
        </p>
      </div>

      {/* Current month — always expanded */}
      <div className="space-y-4">
        <h2 className="text-base font-medium text-foreground">
          Current month
        </h2>
        <StudentAttendanceMonthCard
          attendanceRate={currentSummary.attendanceRate}
          presentCount={currentSummary.presentCount}
          lateCount={currentSummary.lateCount}
          absentCount={currentSummary.absentCount}
          participationAvg={currentSummary.participationAvg}
          detailsHref={undefined}
          title={currentMonthLabel}
        />
        <DotStrip sessions={currentSessions} />
        <SessionHistoryTable
          sessions={currentSessions}
          monthLabel={currentMonthLabel}
        />
      </div>

      {/* Previous months — accordion */}
      {previousMonthKeys.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-medium text-foreground">
            Previous months
          </h2>
          <div className="divide-y divide-[#e5e7eb] rounded-lg border border-[#e5e7eb] bg-card">
            {previousMonthKeys.map((monthKey) => {
              const summary = previousSummaries[monthKey];
              const isExpanded = expandedMonth === monthKey;
              const details = loadedMonthData[monthKey];
              const loading = isExpanded && !details && isPending;
              const monthLabel = formatMonthLabel(monthKey);

              return (
                <div key={monthKey} className="first:rounded-t-lg last:rounded-b-lg">
                  <button
                    type="button"
                    onClick={() => handleExpand(monthKey)}
                    className="flex w-full items-center gap-3 py-3 px-4 text-left hover:bg-muted/40 transition-colors rounded-lg"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground min-w-[140px]">
                      {monthLabel}
                    </span>
                    {summary && (
                      <span className="text-sm text-muted-foreground">
                        {formatPct(summary.attendanceRate)} · P {summary.presentCount} / L{' '}
                        {summary.lateCount} / A {summary.absentCount} · Avg{' '}
                        {formatAvg(summary.participationAvg)}
                      </span>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#e5e7eb] bg-muted/20 px-4 pb-4 pt-2">
                      {loading && (
                        <p className="text-sm text-muted-foreground py-4">
                          Loading…
                        </p>
                      )}
                      {details && !loading && (
                        <div className="space-y-4">
                          <StudentAttendanceMonthCard
                            attendanceRate={details.summary.attendanceRate}
                            presentCount={details.summary.presentCount}
                            lateCount={details.summary.lateCount}
                            absentCount={details.summary.absentCount}
                            participationAvg={details.summary.participationAvg}
                            detailsHref={undefined}
                            title={monthLabel}
                          />
                          <DotStrip sessions={details.sessions} />
                          <SessionHistoryTable
                            sessions={details.sessions}
                            monthLabel={monthLabel}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
