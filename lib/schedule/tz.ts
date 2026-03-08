/**
 * Timezone utilities for schedule generation and display.
 * Uses Intl to avoid external date libs.
 *
 * Core model:
 * - Classes have scheduleTimezone (source, e.g. Asia/Ulaanbaatar)
 * - Occurrences have startsAt/endsAt in UTC
 * - Display times should use viewer timezone (user.timezone or browser)
 */

/** Date key (YYYY-MM-DD) in the given timezone for grouping/sorting. */
export function getDateKeyInTz(date: Date | string, tz: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', { timeZone: tz });
}

/** Format date/time for display in the viewer's timezone. */
export function formatInTimezone(
  date: Date | string,
  tz: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(undefined, { timeZone: tz, ...options });
}

const DEFAULT_TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

/**
 * Convert HH:mm in a source timezone to viewer timezone for display.
 * @param referenceDate - Optional. Use the actual occurrence/session date for DST-correct conversion.
 *   When omitted, falls back to "today" in source TZ (can be wrong around DST boundaries).
 */
export function formatScheduleTimeInViewerTz(
  hhmm: string | null,
  sourceTz: string,
  viewerTz: string,
  referenceDate?: Date | string,
  options: Intl.DateTimeFormatOptions = DEFAULT_TIME_OPTS
): string {
  if (!hhmm?.trim()) return '—';
  const [hh, mm] = hhmm.trim().split(':').map(Number);
  const hour = hh ?? 0;
  const minute = mm ?? 0;
  const ref = referenceDate
    ? (typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate)
    : new Date();
  const parts = getLocalDatePartsInTz(ref, sourceTz);
  const utcDate = localTimeInZoneToUTC(parts.year, parts.month, parts.day, hour, minute, sourceTz);
  return utcDate.toLocaleTimeString(undefined, { ...options, timeZone: viewerTz });
}

/** Given local date/time in IANA timezone, return the UTC Date. */
export function localTimeInZoneToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tz: string
): Date {
  const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const targetTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const utcStart = Date.UTC(year, month - 1, day - 1, 0, 0, 0);
  const stepMs = 15 * 60 * 1000;
  for (let t = utcStart; t < utcStart + 48 * 60 * 60 * 1000; t += stepMs) {
    const d = new Date(t);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const get = (p: string) => parts.find((x) => x.type === p)?.value ?? '';
    const localDate = `${get('year')}-${get('month')}-${get('day')}`;
    const localTime = `${get('hour')}:${get('minute')}`;
    if (localDate === targetDate && localTime === targetTime) return d;
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
}

/** Weekday (0=Sun .. 6=Sat) in tz at UTC timestamp. */
export function getWeekdayInTz(utcDate: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' });
  const day = fmt.format(utcDate);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[day] ?? 0;
}

/** Local date parts in tz at UTC timestamp. */
export function getLocalDatePartsInTz(
  utcDate: Date,
  tz: string
): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(utcDate);
  const get = (p: string) => parseInt(parts.find((x) => x.type === p)?.value ?? '0', 10);
  return { year: get('year'), month: get('month'), day: get('day') };
}
