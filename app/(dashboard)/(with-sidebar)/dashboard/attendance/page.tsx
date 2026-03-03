export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { requireRole } from '@/lib/auth/user';
import {
  getCurrentMonthKey,
  getAvailableAttendanceMonths,
  getStudentAttendanceMonthSummary,
  getStudentAttendanceMonthSessions,
} from '@/lib/db/queries/attendance';
import { AttendanceDetailsView } from './AttendanceDetailsView';

const MONTHS_LIMIT = 6;

export default async function AttendanceDetailsPage() {
  const user = await requireRole(['student']);

  const currentMonthKey = getCurrentMonthKey();
  const [availableMonthKeys, currentSummary, currentSessions] = await Promise.all([
    getAvailableAttendanceMonths(user.id, MONTHS_LIMIT),
    getStudentAttendanceMonthSummary(user.id, currentMonthKey),
    getStudentAttendanceMonthSessions(user.id, currentMonthKey),
  ]);

  const previousMonthKeys = availableMonthKeys.filter((k) => k !== currentMonthKey);

  const previousSummariesEntries = await Promise.all(
    previousMonthKeys.map(async (monthKey) => {
      const summary = await getStudentAttendanceMonthSummary(user.id, monthKey);
      return [monthKey, summary] as const;
    })
  );
  const previousSummaries = Object.fromEntries(previousSummariesEntries);

  const currentSessionsSerialized = currentSessions.map((s) => ({
    ...s,
    startsAt:
      s.startsAt instanceof Date ? s.startsAt.toISOString() : s.startsAt,
  }));

  return (
    <section className="flex-1">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>
      <AttendanceDetailsView
        currentMonthKey={currentMonthKey}
        currentSummary={currentSummary}
        currentSessions={currentSessionsSerialized}
        previousMonthKeys={previousMonthKeys}
        previousSummaries={previousSummaries}
      />
    </section>
  );
}
