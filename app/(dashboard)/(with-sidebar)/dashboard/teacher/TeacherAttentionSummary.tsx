'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BookOpen, MessageSquare, AlertCircle } from 'lucide-react';
import type { AttendanceNeededItem } from '@/lib/db/queries/teacher-dashboard';

type Props = {
  classesTodayCount: number;
  homeworkToReviewCount: number;
  attendanceNeeded: AttendanceNeededItem[];
  unreadMessagesCount?: number;
};

export function TeacherAttentionSummary({
  classesTodayCount,
  homeworkToReviewCount,
  attendanceNeeded,
  unreadMessagesCount = 0,
}: Props) {
  const t = useTranslations('teacher.dashboard');

  const hasAttention =
    classesTodayCount > 0 ||
    homeworkToReviewCount > 0 ||
    attendanceNeeded.length > 0 ||
    unreadMessagesCount > 0;

  if (!hasAttention) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {t('nothingNeedsAttention')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#1f2937]">{t('needsAttention')}</h3>
      <div className="flex flex-wrap gap-2">
        {attendanceNeeded.length > 0 && (
          <>
            {attendanceNeeded.slice(0, 3).map((a) => (
              <Link
                key={a.sessionId}
                href={`/classroom/${a.classId}/attendance?session=${a.sessionId}`}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-500/80 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
              >
                <AlertCircle className="h-4 w-4" aria-hidden />
                {a.className} — {t('takeAttendance')}
              </Link>
            ))}
            {attendanceNeeded.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                +{attendanceNeeded.length - 3} {t('more')}
              </span>
            )}
          </>
        )}
        {classesTodayCount > 0 && (
          <Link
            href="/dashboard/teacher/schedule"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#429ead]/50 bg-[#429ead]/5 px-3 py-1.5 text-sm font-medium text-[#1f2937] transition-colors hover:bg-[#429ead]/10"
          >
            {t('classesToday', { count: classesTodayCount })}
          </Link>
        )}
        {homeworkToReviewCount > 0 && (
          <Link
            href="/dashboard/homework"
            className="inline-flex items-center gap-1.5 rounded-full border border-muted bg-muted/50 px-3 py-1.5 text-sm font-medium text-[#1f2937] transition-colors hover:bg-muted/80"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            {t('homeworkToReview', { count: homeworkToReviewCount })}
          </Link>
        )}
        {unreadMessagesCount > 0 && (
          <Link
            href="/dashboard/messages"
            className="inline-flex items-center gap-1.5 rounded-full border border-muted bg-muted/50 px-3 py-1.5 text-sm font-medium text-[#1f2937] transition-colors hover:bg-muted/80"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            {t('unreadMessages', { count: unreadMessagesCount })}
          </Link>
        )}
      </div>
    </div>
  );
}
