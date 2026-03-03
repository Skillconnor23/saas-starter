export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireClassroomAccess, canPostToClassroom } from '@/lib/auth/classroom';
import {
  getClassSessions,
  getOrCreateTodaySession,
  getSessionAttendance,
  getSessionRecordCounts,
} from '@/lib/db/queries/attendance';
import { AttendanceForm } from './AttendanceForm';

type Props = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ session?: string }>;
};

function getDefaultSessionId(
  sessions: { id: string; startsAt: Date }[],
  timezone: string,
  todayResult: { session: { id: string; startsAt: Date } }
): string {
  const tz = timezone || 'UTC';
  const todayInTz = new Date().toLocaleDateString('en-CA', { timeZone: tz });
  const now = new Date().getTime();

  const forToday = sessions.find((s) => {
    const sessionDate = new Date(s.startsAt).toLocaleDateString('en-CA', {
      timeZone: tz,
    });
    return sessionDate === todayInTz;
  });
  if (forToday) return forToday.id;

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const upcoming = sorted.find((s) => new Date(s.startsAt).getTime() >= now);
  if (upcoming) return upcoming.id;

  const past = sorted.filter((s) => new Date(s.startsAt).getTime() < now);
  if (past.length > 0) return past[past.length - 1]!.id;

  return todayResult.session.id;
}

export default async function AttendancePage({ params, searchParams }: Props) {
  const { classId } = await params;
  const { session: sessionIdParam } = await searchParams;
  const { user, eduClass } = await requireClassroomAccess(classId);

  const canPost = await canPostToClassroom(user, classId);
  if (!canPost) {
    redirect(`/classroom/${classId}`);
  }

  const [sessions, todayResult, recordCounts] = await Promise.all([
    getClassSessions(classId),
    getOrCreateTodaySession(classId),
    getSessionRecordCounts(classId),
  ]);

  const sessionId =
    sessionIdParam && sessions.some((s) => s.id === sessionIdParam)
      ? sessionIdParam
      : getDefaultSessionId(
          sessions,
          eduClass.timezone ?? 'UTC',
          todayResult
        );

  const attendanceData = await getSessionAttendance(sessionId);
  if (!attendanceData) {
    redirect(`/classroom/${classId}`);
  }

  const rosterCount = attendanceData.roster.length;
  const tz = eduClass.timezone ?? 'UTC';
  const now = Date.now();

  const sessionsWithCompletion = sessions.map((s) => {
    const count = recordCounts.get(s.id) ?? 0;
    const completed = rosterCount > 0 && count >= rosterCount;
    const startsAt = new Date(s.startsAt).getTime();
    const isIncompletePast = !completed && startsAt < now;
    return {
      id: s.id,
      startsAt: s.startsAt,
      isCompleted: completed,
      isIncompletePast,
    };
  });

  const isCompleted =
    rosterCount > 0 &&
    (recordCounts.get(sessionId) ?? 0) >= rosterCount;

  return (
    <section className="flex flex-col p-4 lg:px-6 lg:py-5 min-h-0 flex-1">
      <div className="mx-auto w-full max-w-[1400px]">
        <AttendanceForm
          key={sessionId}
          classId={classId}
          sessionId={sessionId}
          eduClassName={eduClass.name}
          eduClassTimezone={eduClass.timezone}
          roster={attendanceData.roster}
          records={attendanceData.records}
          sessions={sessionsWithCompletion}
          isSessionCompleted={isCompleted}
          rosterCount={rosterCount}
        />
      </div>
    </section>
  );
}
