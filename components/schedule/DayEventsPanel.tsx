"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CalendarEventClient } from "@/lib/schedule/calendar-events";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock3, Video, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  dateLabel: string;
  events: CalendarEventClient[];
  viewerTimezone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function parseDate(value: string): Date {
  return new Date(value);
}

function formatTimeRange(ev: CalendarEventClient, viewerTimezone: string): string {
  const start = parseDate(ev.startsAt);
  const end = parseDate(ev.endsAt);
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: viewerTimezone || "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const startStr = start.toLocaleTimeString(undefined, opts);
  const endStr = end.toLocaleTimeString(undefined, opts);
  return `${startStr} – ${endStr}`;
}

function formatClassTimezone(ev: CalendarEventClient): string {
  return ev.classTimezone;
}

function isJoinWindow(ev: CalendarEventClient): boolean {
  const now = new Date();
  const start = parseDate(ev.startsAt);
  const end = parseDate(ev.endsAt);
  const windowStart = new Date(start.getTime() - 10 * 60 * 1000);
  const windowEnd = new Date(end.getTime() + 10 * 60 * 1000);
  return now >= windowStart && now <= windowEnd && !!ev.joinUrl;
}

export function DayEventsPanel({
  dateLabel,
  events,
  viewerTimezone,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations("schedule");
  if (!open) return null;

  const handleBackdropClick = () => onOpenChange(false);

  return (
    <>
      {/* Backdrop (mobile & desktop) */}
      <div
        className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent lg:pointer-events-none"
        onClick={handleBackdropClick}
      />

      {/* Desktop: right-side panel */}
      <aside className="fixed inset-y-0 right-0 z-50 hidden w-full max-w-md border-l bg-white shadow-lg lg:flex lg:flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t("classesOn")}</p>
              <p className="text-sm text-muted-foreground">{dateLabel}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {events.map((ev) => {
            const joinAllowed = isJoinWindow(ev);
            return (
              <div
                key={ev.id}
                className="rounded-lg border border-slate-200 bg-muted/30 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium truncate max-w-[16rem]">
                        {ev.title}
                      </p>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatTimeRange(ev, viewerTimezone)}</span>
                    </p>
<p className="mt-0.5 text-xs text-muted-foreground">
                    {t("classTimezone", { tz: formatClassTimezone(ev) })}
                  </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {joinAllowed && ev.joinUrl && (
                    <Button
                      asChild
                      size="sm"
                      className="gap-1.5"
                    >
                      <a
                        href={ev.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Video className="h-4 w-4" />
                        {t("join")}
                      </a>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant={joinAllowed ? "outline" : "default"}
                    size="sm"
                    className={cn("gap-1.5", joinAllowed && "ml-1") }
                  >
                    <Link href={ev.classroomUrl}>{t("openClassroom")}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile: bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t bg-white shadow-lg lg:hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("classesOn")}
            </span>
            <span className="text-sm font-medium">{dateLabel}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3 space-y-3">
          {events.map((ev) => {
            const joinAllowed = isJoinWindow(ev);
            return (
              <div
                key={ev.id}
                className="rounded-lg border border-slate-200 bg-muted/40 p-3 space-y-2"
              >
                <p className="text-sm font-medium truncate">
                  {ev.title}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{formatTimeRange(ev, viewerTimezone)}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("classTimezone", { tz: formatClassTimezone(ev) })}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  {joinAllowed && ev.joinUrl && (
                    <Button
                      asChild
                      size="sm"
                      className="gap-1.5 flex-1 justify-center"
                    >
                      <a
                        href={ev.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Video className="h-4 w-4" />
                        {t("join")}
                      </a>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant={joinAllowed ? "outline" : "default"}
                    size="sm"
                    className="flex-1 justify-center"
                  >
                    <Link href={ev.classroomUrl}>{t("openClassroom")}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

