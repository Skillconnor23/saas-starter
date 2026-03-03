import { eq, and, desc, gte, lte, inArray, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import {
  classSessions,
  attendanceRecords,
  eduClasses,
  eduEnrollments,
  users,
} from '../schema';
import type { AttendanceStatus } from '../schema';

/** Current calendar month range (UTC). Single source of truth. */
export function getCurrentMonthRange(): { monthStart: Date; now: Date } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { monthStart, now };
}

/** Parse YYYY-MM to UTC date range for that calendar month. */
export function monthKeyToRange(monthKey: string): {
  monthStart: Date;
  monthEnd: Date;
} {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    return {
      monthStart: new Date(Date.UTC(year, month, 1, 0, 0, 0)),
      monthEnd: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
    };
  }
  const monthStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { monthStart, monthEnd };
}

/** Current month as YYYY-MM. */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

export type StudentMonthSummary = {
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  participationAvg: number | null;
};

/** Student's attendance this month. Optionally filter by classId. */
export async function getStudentMonthSummary(params: {
  studentUserId: number;
  classId?: string;
}): Promise<StudentMonthSummary> {
  const { monthStart, now } = getCurrentMonthRange();

  const conditions = [
    eq(eduEnrollments.studentUserId, params.studentUserId),
    eq(eduEnrollments.status, 'active'),
    gte(classSessions.startsAt, monthStart),
    lte(classSessions.startsAt, now),
  ];
  if (params.classId) conditions.push(eq(eduEnrollments.classId, params.classId));

  const sessionsInRange = await db
    .selectDistinct({ sessionId: classSessions.id })
    .from(eduEnrollments)
    .innerJoin(classSessions, eq(classSessions.classId, eduEnrollments.classId))
    .where(and(...conditions));

  const sessionIds = sessionsInRange.map((r) => r.sessionId);
  if (sessionIds.length === 0) {
    return {
      totalSessions: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      attendanceRate: 0,
      participationAvg: null,
    };
  }

  const [countsRow, avgRow] = await Promise.all([
    db
      .select({
        presentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        lateCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        absentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.studentUserId, params.studentUserId),
          inArray(attendanceRecords.sessionId, sessionIds)
        )
      )
      .then((r) => r[0]),
    db
      .select({
        avg: sql<number | null>`avg(${attendanceRecords.participationScore})::float`,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.studentUserId, params.studentUserId),
          inArray(attendanceRecords.sessionId, sessionIds)
        )
      )
      .then((r) => r[0]?.avg ?? null),
  ]);

  const presentCount = countsRow?.presentCount ?? 0;
  const lateCount = countsRow?.lateCount ?? 0;
  const absentCount = countsRow?.absentCount ?? 0;
  const totalSessions = sessionIds.length;
  const marked = presentCount + lateCount + absentCount;
  const attendanceRate = totalSessions > 0 ? (presentCount + lateCount) / totalSessions : 0;
  const participationAvg =
    avgRow != null && avgRow !== undefined ? Number(avgRow) : null;

  return {
    totalSessions,
    presentCount,
    lateCount,
    absentCount,
    attendanceRate,
    participationAvg: participationAvg != null ? Number(participationAvg) : null,
  };
}

/** Student attendance summary for a given month (by monthKey YYYY-MM). */
export async function getStudentAttendanceMonthSummary(
  studentUserId: number,
  monthKey: string
): Promise<StudentMonthSummary> {
  const { monthStart, monthEnd } = monthKeyToRange(monthKey);

  const sessionsInRange = await db
    .selectDistinct({ sessionId: classSessions.id })
    .from(eduEnrollments)
    .innerJoin(classSessions, eq(classSessions.classId, eduEnrollments.classId))
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active'),
        gte(classSessions.startsAt, monthStart),
        lte(classSessions.startsAt, monthEnd)
      )
    );

  const sessionIds = sessionsInRange.map((r) => r.sessionId);
  if (sessionIds.length === 0) {
    return {
      totalSessions: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      attendanceRate: 0,
      participationAvg: null,
    };
  }

  const [countsRow, avgRow] = await Promise.all([
    db
      .select({
        presentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        lateCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        absentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.studentUserId, studentUserId),
          inArray(attendanceRecords.sessionId, sessionIds)
        )
      )
      .then((r) => r[0]),
    db
      .select({
        avg: sql<number | null>`avg(${attendanceRecords.participationScore})::float`,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.studentUserId, studentUserId),
          inArray(attendanceRecords.sessionId, sessionIds)
        )
      )
      .then((r) => r[0]?.avg ?? null),
  ]);

  const presentCount = countsRow?.presentCount ?? 0;
  const lateCount = countsRow?.lateCount ?? 0;
  const absentCount = countsRow?.absentCount ?? 0;
  const totalSessions = sessionIds.length;
  const attendanceRate =
    totalSessions > 0 ? (presentCount + lateCount) / totalSessions : 0;
  const participationAvg =
    avgRow != null && avgRow !== undefined ? Number(avgRow) : null;

  return {
    totalSessions,
    presentCount,
    lateCount,
    absentCount,
    attendanceRate,
    participationAvg: participationAvg != null ? Number(participationAvg) : null,
  };
}

export type StudentMonthSessionRow = {
  sessionId: string;
  startsAt: Date;
  className: string | null;
  status: AttendanceStatus | null;
  participationScore: number | null;
  teacherNote: string | null;
};

/** Sessions in a month for a student with their attendance record (if any). */
export async function getStudentAttendanceMonthSessions(
  studentUserId: number,
  monthKey: string
): Promise<StudentMonthSessionRow[]> {
  const { monthStart, monthEnd } = monthKeyToRange(monthKey);

  const sessionsWithEnrollment = await db
    .select({
      sessionId: classSessions.id,
      startsAt: classSessions.startsAt,
      className: eduClasses.name,
    })
    .from(eduEnrollments)
    .innerJoin(classSessions, eq(classSessions.classId, eduEnrollments.classId))
    .innerJoin(eduClasses, eq(eduClasses.id, eduEnrollments.classId))
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active'),
        gte(classSessions.startsAt, monthStart),
        lte(classSessions.startsAt, monthEnd)
      )
    )
    .orderBy(classSessions.startsAt);

  if (sessionsWithEnrollment.length === 0) return [];

  const sessionIds = sessionsWithEnrollment.map((s) => s.sessionId);
  const records = await db
    .select({
      sessionId: attendanceRecords.sessionId,
      status: attendanceRecords.status,
      participationScore: attendanceRecords.participationScore,
      teacherNote: attendanceRecords.teacherNote,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.studentUserId, studentUserId),
        inArray(attendanceRecords.sessionId, sessionIds)
      )
    );

  const recordBySession = new Map(
    records.map((r) => [r.sessionId, r])
  );

  return sessionsWithEnrollment.map((s) => {
    const rec = recordBySession.get(s.sessionId);
    return {
      sessionId: s.sessionId,
      startsAt: s.startsAt,
      className: s.className,
      status: (rec?.status as AttendanceStatus) ?? null,
      participationScore: rec?.participationScore ?? null,
      teacherNote: rec?.teacherNote ?? null,
    };
  });
}

/** Month keys (YYYY-MM) that have sessions for this student, newest first; or last N months if none. */
export async function getAvailableAttendanceMonths(
  studentUserId: number,
  limit = 6
): Promise<string[]> {
  const rows = await db
    .select({ startsAt: classSessions.startsAt })
    .from(eduEnrollments)
    .innerJoin(classSessions, eq(classSessions.classId, eduEnrollments.classId))
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active')
      )
    )
    .orderBy(desc(classSessions.startsAt));

  const seen = new Set<string>();
  const monthKeys: string[] = [];
  for (const r of rows) {
    const d = new Date(r.startsAt);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!seen.has(key)) {
      seen.add(key);
      monthKeys.push(key);
      if (monthKeys.length >= limit) break;
    }
  }

  if (monthKeys.length > 0) return monthKeys;

  const now = new Date();
  const result: string[] = [];
  for (let i = 0; i < limit; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    result.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    );
  }
  return result;
}

export type ClassMonthSummary = {
  totalSessionsHeld: number;
  totalMarked: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  lateRate: number;
  participationAvg: number | null;
};

/** Class attendance summary this month. */
export async function getClassMonthSummary(params: {
  classId: string;
}): Promise<ClassMonthSummary> {
  const { monthStart, now } = getCurrentMonthRange();

  const [sessionsCount, agg] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(classSessions)
      .where(
        and(
          eq(classSessions.classId, params.classId),
          gte(classSessions.startsAt, monthStart),
          lte(classSessions.startsAt, now)
        )
      )
      .then((r) => r[0]?.count ?? 0),
    db
      .select({
        totalMarked: sql<number>`count(*)::int`,
        presentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        lateCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        absentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
        participationAvg: sql<number | null>`avg(${attendanceRecords.participationScore}) filter (where ${attendanceRecords.participationScore} is not null)::float`,
      })
      .from(attendanceRecords)
      .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
      .where(
        and(
          eq(classSessions.classId, params.classId),
          gte(classSessions.startsAt, monthStart),
          lte(classSessions.startsAt, now)
        )
      )
      .then((r) => r[0]),
  ]);

  const totalMarked = agg?.totalMarked ?? 0;
  const presentCount = agg?.presentCount ?? 0;
  const lateCount = agg?.lateCount ?? 0;
  const absentCount = agg?.absentCount ?? 0;
  const attendanceRate = totalMarked > 0 ? (presentCount + lateCount) / totalMarked : 0;
  const lateRate = totalMarked > 0 ? lateCount / totalMarked : 0;
  const participationAvg =
    agg?.participationAvg != null ? Number(agg.participationAvg) : null;

  return {
    totalSessionsHeld: sessionsCount,
    totalMarked,
    presentCount,
    lateCount,
    absentCount,
    attendanceRate,
    lateRate,
    participationAvg,
  };
}

export type SchoolMonthSummary = {
  totalMarked: number;
  attendanceRate: number;
  lateRate: number;
  participationAvg: number | null;
  atRiskCount: number;
};

/** School-wide attendance summary this month (all classes). */
export async function getSchoolMonthSummary(): Promise<SchoolMonthSummary> {
  const { monthStart, now } = getCurrentMonthRange();

  const [agg, atRiskRows] = await Promise.all([
    db
      .select({
        totalMarked: sql<number>`count(*)::int`,
        presentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        lateCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        participationAvg: sql<number | null>`avg(${attendanceRecords.participationScore}) filter (where ${attendanceRecords.participationScore} is not null)::float`,
      })
      .from(attendanceRecords)
      .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
      .where(
        and(
          gte(classSessions.startsAt, monthStart),
          lte(classSessions.startsAt, now)
        )
      )
      .then((r) => r[0]),
    db
      .select({
        studentUserId: attendanceRecords.studentUserId,
        absentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
        presentCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        lateCount: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
      })
      .from(attendanceRecords)
      .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
      .where(
        and(
          gte(classSessions.startsAt, monthStart),
          lte(classSessions.startsAt, now)
        )
      )
      .groupBy(attendanceRecords.studentUserId)
      .then((rows) => rows),
  ]);

  const totalMarked = agg?.totalMarked ?? 0;
  const presentCount = agg?.presentCount ?? 0;
  const lateCount = agg?.lateCount ?? 0;
  const attendanceRate = totalMarked > 0 ? (presentCount + lateCount) / totalMarked : 0;
  const lateRate = totalMarked > 0 ? lateCount / totalMarked : 0;
  const participationAvg =
    agg?.participationAvg != null ? Number(agg.participationAvg) : null;

  let atRiskCount = 0;
  for (const row of atRiskRows) {
    const marked = (row.presentCount ?? 0) + (row.lateCount ?? 0) + (row.absentCount ?? 0);
    const rate = marked > 0 ? ((row.presentCount ?? 0) + (row.lateCount ?? 0)) / marked : 0;
    if ((row.absentCount ?? 0) >= 3 || rate < 0.7) atRiskCount++;
  }

  return {
    totalMarked,
    attendanceRate,
    lateRate,
    participationAvg,
    atRiskCount,
  };
}

export type ClassSessionWithDate = {
  id: string;
  classId: string;
  startsAt: Date;
  createdAt: Date;
};

/** List sessions for a class, newest first. */
export async function getClassSessions(
  classId: string
): Promise<ClassSessionWithDate[]> {
  const rows = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.classId, classId))
    .orderBy(desc(classSessions.startsAt));
  return rows;
}

/** Returns record count per session for a class. Used for completion badges. */
export async function getSessionRecordCounts(
  classId: string
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      sessionId: attendanceRecords.sessionId,
      count: sql<number>`count(*)::int`,
    })
    .from(attendanceRecords)
    .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
    .where(eq(classSessions.classId, classId))
    .groupBy(attendanceRecords.sessionId);
  return new Map(rows.map((r) => [r.sessionId, r.count]));
}

export type RosterStudent = {
  studentUserId: number;
  studentName: string | null;
  studentEmail: string;
};

export type AttendanceRecordRow = {
  id: string;
  studentUserId: number;
  status: AttendanceStatus;
  participationScore: number | null;
  teacherNote: string | null;
};

export type SessionAttendanceData = {
  session: ClassSessionWithDate;
  roster: RosterStudent[];
  records: AttendanceRecordRow[];
};

/** Get roster (active enrollments) plus existing attendance records for a session. */
export async function getSessionAttendance(
  sessionId: string
): Promise<SessionAttendanceData | null> {
  const [session] = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.id, sessionId))
    .limit(1);
  if (!session) return null;

  const roster = await db
    .select({
      studentUserId: eduEnrollments.studentUserId,
      studentName: users.name,
      studentEmail: users.email,
    })
    .from(eduEnrollments)
    .innerJoin(users, eq(eduEnrollments.studentUserId, users.id))
    .where(
      and(
        eq(eduEnrollments.classId, session.classId),
        eq(eduEnrollments.status, 'active')
      )
    )
    .orderBy(users.name);

  const records = await db
    .select({
      id: attendanceRecords.id,
      studentUserId: attendanceRecords.studentUserId,
      status: attendanceRecords.status,
      participationScore: attendanceRecords.participationScore,
      teacherNote: attendanceRecords.teacherNote,
    })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, sessionId));

  return {
    session: {
      id: session.id,
      classId: session.classId,
      startsAt: session.startsAt,
      createdAt: session.createdAt,
    },
    roster: roster.map((r) => ({
      studentUserId: r.studentUserId,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
    })),
    records: records.map((r) => ({
      id: r.id,
      studentUserId: r.studentUserId,
      status: r.status as AttendanceStatus,
      participationScore: r.participationScore,
      teacherNote: r.teacherNote,
    })),
  };
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Get or create today's session for a class. Today is determined by class timezone or UTC. */
export async function getOrCreateTodaySession(classId: string): Promise<{
  session: ClassSessionWithDate;
  created: boolean;
}> {
  const now = new Date();
  const todayStr = toDateOnly(now);

  // Find a session whose starts_at date matches today (in UTC for simplicity)
  const sessions = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.classId, classId))
    .orderBy(desc(classSessions.startsAt));

  const todaySession = sessions.find((s) => {
    const sessionDate = toDateOnly(new Date(s.startsAt));
    return sessionDate === todayStr;
  });

  if (todaySession) {
    return {
      session: {
        id: todaySession.id,
        classId: todaySession.classId,
        startsAt: todaySession.startsAt,
        createdAt: todaySession.createdAt,
      },
      created: false,
    };
  }

  const [created] = await db
    .insert(classSessions)
    .values({
      classId,
      startsAt: now,
    })
    .returning();

  if (!created) throw new Error('Failed to create session');

  return {
    session: {
      id: created.id,
      classId: created.classId,
      startsAt: created.startsAt,
      createdAt: created.createdAt,
    },
    created: true,
  };
}
