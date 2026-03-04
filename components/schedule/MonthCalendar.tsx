"use client";

import * as React from "react";
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from "lucide-react";
import type { CalendarEventClient } from "@/lib/schedule/calendar-events";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DayEventsPanel } from "@/components/schedule/DayEventsPanel";

type Props = {
  initialMonthStart: string; // ISO date for 1st of month in viewer tz
  initialMonthEnd: string; // ISO date for end of month range
  initialEvents: CalendarEventClient[];
  viewerTimezone: string;
};

type DayCell = {
  date: Date;
  inCurrentMonth: boolean;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, count: number): Date {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + count);
  return copy;
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

function formatDayNumber(d: Date): number {
  return d.getDate();
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(monthDate: Date): DayCell[] {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const startWeekday = start.getDay(); // 0=Sun

  const cells: DayCell[] = [];

  // Days from previous month to fill first week
  if (startWeekday > 0) {
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(d.getDate() - (i + 1 - (startWeekday - 1)));
      cells.push({ date: d, inCurrentMonth: false });
    }
  }

  // Current month days
  for (let day = 1; day <= end.getDate(); day++) {
    const d = new Date(start.getFullYear(), start.getMonth(), day);
    cells.push({ date: d, inCurrentMonth: true });
  }

  // Next month days to complete rows (up to 6 weeks)
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1]!.date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inCurrentMonth: false });
  }

  return cells;
}

function eventsByDate(
  events: CalendarEventClient[]
): Map<string, CalendarEventClient[]> {
  const map = new Map<string, CalendarEventClient[]>();
  for (const ev of events) {
    const key = ev.startsAt.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  return map;
}

function getDefaultSelectedDateKeyForMonth(
  byDate: Map<string, CalendarEventClient[]>,
  monthStart: Date,
  monthEnd: Date,
  today: Date
): string {
  const todayKey = formatDateKey(today);
  const monthStartStr = formatDateKey(monthStart);
  const monthEndStr = formatDateKey(monthEnd);
  const keys = Array.from(byDate.keys()).sort();

  if (byDate.has(todayKey)) return todayKey;

  const next = keys.find(
    (k) => k >= todayKey && k >= monthStartStr && k <= monthEndStr
  );
  if (next) return next;
  return todayKey;
}

function isJoinWindow(ev: CalendarEventClient): boolean {
  const now = new Date();
  const start = new Date(ev.startsAt);
  const end = new Date(ev.endsAt);
  const windowStart = new Date(start.getTime() - 10 * 60 * 1000);
  const windowEnd = new Date(end.getTime() + 10 * 60 * 1000);
  return now >= windowStart && now <= windowEnd && !!ev.joinUrl;
}

function formatEventTimeRange(ev: CalendarEventClient, tz: string): string {
  const start = new Date(ev.startsAt);
  const end = new Date(ev.endsAt);
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: tz || "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return `${start.toLocaleTimeString(undefined, opts)} – ${end.toLocaleTimeString(undefined, opts)}`;
}

type DayPanelState = {
  dateKey: string | null;
};

export function MonthCalendar({
  initialMonthStart,
  initialMonthEnd,
  initialEvents,
  viewerTimezone,
}: Props) {
  const tSchedule = useTranslations('schedule');
  const initialMonthDate = startOfMonth(new Date(initialMonthStart));
  const initialMonthEndDate = endOfMonth(initialMonthDate);
  const today = new Date();
  const todayKey = formatDateKey(today);
  const initialByDate = eventsByDate(initialEvents);
  const initialSelectedDateKey = getDefaultSelectedDateKeyForMonth(
    initialByDate,
    initialMonthDate,
    initialMonthEndDate,
    today
  );

  const [monthDate, setMonthDate] = React.useState(initialMonthDate);
  const [events, setEvents] = React.useState<CalendarEventClient[]>(initialEvents);
  const [loading, setLoading] = React.useState(false);
  const [panelState, setPanelState] = React.useState<DayPanelState>({ dateKey: null });
  const [selectedDateKey, setSelectedDateKey] =
    React.useState<string>(initialSelectedDateKey);

  const byDate = React.useMemo(() => eventsByDate(events), [events]);

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const handleChangeMonth = async (delta: number) => {
    const nextMonthDate = addMonths(monthDate, delta);
    const nextMonthStart = startOfMonth(nextMonthDate);
    const nextMonthEnd = endOfMonth(nextMonthStart);
    setLoading(true);
    try {
      const startStr = nextMonthStart.toISOString();
      const endStr = nextMonthEnd.toISOString();
      const res = await fetch(
        `/api/schedule/month?start=${encodeURIComponent(
          startStr
        )}&end=${encodeURIComponent(endStr)}`
      );
      if (res.ok) {
        const data = (await res.json()) as CalendarEventClient[];
        const nextByDate = eventsByDate(data);
        const nextSelected = getDefaultSelectedDateKeyForMonth(
          nextByDate,
          nextMonthStart,
          nextMonthEnd,
          new Date()
        );
        setEvents(data);
        setMonthDate(nextMonthStart);
        setSelectedDateKey(nextSelected);
      } else {
        console.error("Failed to load month events", await res.text());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToday = async () => {
    const now = new Date();
    const targetMonthStart = startOfMonth(now);
    const diffMonths =
      (targetMonthStart.getFullYear() - monthDate.getFullYear()) * 12 +
      (targetMonthStart.getMonth() - monthDate.getMonth());

    if (diffMonths !== 0) {
      await handleChangeMonth(diffMonths);
    } else {
      const selected = getDefaultSelectedDateKeyForMonth(
        byDate,
        monthStart,
        monthEnd,
        now
      );
      setSelectedDateKey(selected);
    }
  };

  const grid = buildMonthGrid(monthDate);

  const openDateKey = panelState.dateKey;
  const openEvents = openDateKey ? byDate.get(openDateKey) ?? [] : [];
  const openDateObj = openDateKey ? new Date(openDateKey) : null;
  const openDateLabel =
    openDateObj?.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }) ?? "";

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-medium">
            {formatMonthLabel(monthStart)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleChangeMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleChangeMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleToday()}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="hidden sm:grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {[
          tSchedule('weekdays.short.sun'),
          tSchedule('weekdays.short.mon'),
          tSchedule('weekdays.short.tue'),
          tSchedule('weekdays.short.wed'),
          tSchedule('weekdays.short.thu'),
          tSchedule('weekdays.short.fri'),
          tSchedule('weekdays.short.sat'),
        ].map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Month grid - desktop/tablet (slightly denser for tablet) */}
      <div className="hidden sm:grid grid-cols-7 gap-px rounded-xl border bg-slate-200 overflow-hidden">
        {grid.map((cell) => {
          const key = formatDateKey(cell.date);
          const dayEvents = byDate.get(key) ?? [];
          const isToday = key === todayKey;
          const visibleEvents = dayEvents.slice(0, 2);
          const extraCount = dayEvents.length - visibleEvents.length;

          return (
            <button
              key={key}
              type="button"
              className={cn(
                "group relative flex flex-col items-stretch bg-white px-1 pb-1 pt-1 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7daf41]/50",
                !cell.inCurrentMonth && "bg-slate-50 text-muted-foreground/70"
              )}
              onClick={() => setPanelState({ dateKey: key })}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday &&
                      "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#7daf41] text-white text-xs"
                  )}
                >
                  {formatDayNumber(cell.date)}
                </span>
              </div>
              <div className="space-y-0.5 min-w-0">
                {visibleEvents.map((ev) => {
                  const start = new Date(ev.startsAt);
                  const timeStr = start.toLocaleTimeString(undefined, {
                    timeZone: viewerTimezone || "UTC",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-1 rounded-full bg-[#7daf41]/10 px-1.5 py-0.5 text-[11px] leading-tight text-[#1f2937] group-hover:bg-[#7daf41]/20 min-w-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPanelState({ dateKey: key });
                      }}
                    >
                      <span className="tabular-nums text-[10px] text-muted-foreground shrink-0">
                        {timeStr}
                      </span>
                    </div>
                  );
                })}
                {extraCount > 0 && (
                  <div className="text-[10px] text-[#7daf41] mt-0.5 font-medium">
                    +{extraCount} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile: month grid with dots + selected-day sessions list */}
      <div className="sm:hidden space-y-3">
        <div className="grid grid-cols-7 gap-px rounded-xl border bg-slate-200 overflow-hidden">
          {grid.map((cell) => {
            const key = formatDateKey(cell.date);
            const dayEvents = byDate.get(key) ?? [];
            const hasEvents = dayEvents.length > 0;
            const isSelected = key === selectedDateKey;
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center bg-white px-1.5 py-2 text-center text-xs",
                  !cell.inCurrentMonth && "bg-slate-50 text-muted-foreground/60",
                  isSelected && "ring-2 ring-[#429ead] ring-offset-0"
                )}
                onClick={() => setSelectedDateKey(key)}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday && "text-[#429ead]"
                  )}
                >
                  {formatDayNumber(cell.date)}
                </span>
                {hasEvents && (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#7daf41]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {(() => {
            const selectedEvents = byDate.get(selectedDateKey) ?? [];
            if (selectedEvents.length === 0) {
              return (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No classes scheduled.
                </p>
              );
            }
            const selectedDate = new Date(selectedDateKey + "T12:00:00");
            const dayLabel = selectedDate.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            return (
              <>
                <p className="text-xs font-medium text-muted-foreground">
                  Sessions · {dayLabel}
                </p>
                {selectedEvents.map((ev) => {
                  const canJoin = isJoinWindow(ev);
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatEventTimeRange(ev, viewerTimezone)}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {ev.title}
                        </span>
                      </div>
                      {canJoin && ev.joinUrl && (
                        <a
                          href={ev.joinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 shrink-0 rounded-md bg-[#429ead] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      </div>

      {/* Day events panel */}
      <DayEventsPanel
        dateLabel={openDateLabel}
        events={openEvents}
        viewerTimezone={viewerTimezone}
        open={!!openDateKey && openEvents.length > 0}
        onOpenChange={(open) =>
          setPanelState((prev) => ({ dateKey: open ? prev.dateKey : null }))
        }
      />

      {loading && (
        <p className="mt-1 text-xs text-muted-foreground">Loading month…</p>
      )}
    </div>
  );
}

