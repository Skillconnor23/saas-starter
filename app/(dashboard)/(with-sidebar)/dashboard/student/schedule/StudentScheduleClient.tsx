'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useViewerTimezone } from '@/lib/hooks/use-viewer-timezone';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonthCalendar } from '@/components/schedule/MonthCalendar';
import { Video, BookOpen, CalendarDays, List } from 'lucide-react';
type UpcomingEvent = {
  id: string;
  classId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  classTimezone: string;
  joinUrl: string | null;
  classroomUrl: string;
};

type Props = {
  initialMonthEvents: UpcomingEvent[];
  upcomingEvents: UpcomingEvent[];
  viewerTimezone: string;
};

function formatSessionDateTime(starts: Date, ends: Date, tz: string): string {
  const dateStr = starts.toLocaleDateString(undefined, {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const startStr = starts.toLocaleTimeString(undefined, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endStr = ends.toLocaleTimeString(undefined, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} · ${startStr} – ${endStr}`;
}

export function StudentScheduleClient({
  initialMonthEvents,
  upcomingEvents,
  viewerTimezone,
}: Props) {
  const t = useTranslations('schedule');
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'agenda' | 'month'>('agenda');
  const tz = useViewerTimezone(viewerTimezone || 'UTC');

  const nextClass = upcomingEvents[0] ?? null;

  const initialEventsForCalendar = initialMonthEvents;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return (
    <div className="space-y-6">
      {/* Next class hero */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full rounded-xl border border-[#6a9538] px-5 py-4 text-white shadow-sm"
        style={{ backgroundColor: '#7daf41' }}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/90 uppercase tracking-wide">
            {t('nextClassTitle')}
          </p>
          {!nextClass ? (
            <p className="text-sm text-white/90 mt-0.5">{t('nextClassEmpty')}</p>
          ) : (
            <>
              <p className="font-medium text-white mt-1">{nextClass.title}</p>
              <p className="text-sm text-white/90 mt-0.5">
                {formatSessionDateTime(
                  new Date(nextClass.startsAt),
                  new Date(nextClass.endsAt),
                  tz
                )}
              </p>
            </>
          )}
        </div>
        {nextClass && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {nextClass.joinUrl ? (
              <Button
                size="sm"
                className="rounded-full bg-white text-[#1f2937] hover:bg-white/90 border-0"
                asChild
              >
                <a
                  href={nextClass.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  <Video className="h-4 w-4" />
                  {t('joinMeeting')}
                </a>
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full bg-white/10 text-white border-white/40 hover:bg-white/20"
              asChild
            >
              <Link
                href={nextClass.classroomUrl}
                className="inline-flex items-center gap-1.5"
              >
                <BookOpen className="h-4 w-4" />
                {t('openClassroom')}
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* View toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-[#e5e7eb] p-0.5 bg-muted/30">
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'agenda'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted-foreground hover:text-gray-700'
            }`}
          >
            <List className="h-4 w-4" />
            {t('viewAgenda')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted-foreground hover:text-gray-700'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            {t('viewMonth')}
          </button>
        </div>
      </div>

      {viewMode === 'agenda' ? (
        /* Agenda: Upcoming list only */
        <Card className="rounded-2xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              {t('upcomingTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('noUpcoming')}
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(ev.classroomUrl)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(ev.classroomUrl);
                        }
                      }}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] bg-gray-50 px-4 py-3 cursor-pointer transition hover:bg-gray-100 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7daf41]/50 focus-visible:ring-offset-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {ev.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatSessionDateTime(
                            new Date(ev.startsAt),
                            new Date(ev.endsAt),
                            tz
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ev.joinUrl && (
                          <a
                            href={ev.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full bg-[#429ead] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#388694] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#429ead]/50 focus-visible:ring-offset-2"
                          >
                            <Video className="h-3.5 w-3.5" />
                            {t('join')}
                          </a>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {t('openClassroom')} →
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Month: 2-col desktop, stacked mobile (upcoming above calendar) */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Mobile: Upcoming first */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <Card className="rounded-2xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)] h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <List className="h-4 w-4 text-muted-foreground" />
                  {t('upcomingTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    {t('noUpcoming')}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {upcomingEvents.slice(0, 8).map((ev) => (
                      <li key={ev.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(ev.classroomUrl)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(ev.classroomUrl);
                            }
                          }}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e5e7eb] bg-gray-50 px-3 py-2.5 cursor-pointer transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7daf41]/50 focus-visible:ring-offset-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {ev.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatSessionDateTime(
                                new Date(ev.startsAt),
                                new Date(ev.endsAt),
                                tz
                              )}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {ev.joinUrl ? (
                              <a
                                href={ev.joinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center rounded-full h-7 shrink-0 bg-[#429ead] px-3 text-xs font-medium text-white transition-colors hover:bg-[#388694] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#429ead]/50 focus-visible:ring-offset-2"
                              >
                                {t('join')}
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                →
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <MonthCalendar
              initialMonthStart={monthStart.toISOString()}
              initialMonthEnd={monthEnd.toISOString()}
              initialEvents={initialEventsForCalendar}
              viewerTimezone={viewerTimezone}
            />
          </div>
        </div>
      )}
    </div>
  );
}
