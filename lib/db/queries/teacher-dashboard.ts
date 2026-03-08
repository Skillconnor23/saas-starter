import { eq, and, gte, lt, asc, desc, sql, inArray, isNull } from 'drizzle-orm';
import { db } from '../drizzle';
import {
  eduClasses,
  eduClassTeachers,
  eduEnrollments,
  eduSessions,
  classSessions,
  attendanceRecords,
  homework,
  homeworkSubmissions,
  users,
  eduQuizClasses,
  eduQuizzes,
  eduQuizSubmissions,
} from '../schema';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ATTEMPT_THRESHOLD = 50;

export type TeacherDashboardClass = {
  id: string;
  name: string;
  geckoLevel: string | null;
  scheduleDays: unknown;
  scheduleStartTime: string | null;
  scheduleTimezone: string | null;
  studentCount: number;
  status: 'on_track' | 'needs_attention';
  avgScore30d: number | null;
  attempts30d: number;
};

export type TeacherDashboardKpis = {
  avgQuizScore30d: number | null;
  attemptRate30d: number;
  inactiveStudents: number;
};

export type TeacherDashboardNeedsAttention = {
  inactiveStudents: { studentId: number; studentName: string | null; classId: string }[];
  lowCompletionQuizzes: { quizId: string; quizTitle: string; className: string; attemptPct: number }[];
};

export type TeacherNextSession = {
  sessionId: string;
  classId: string;
  className: string;
  geckoLevel: string | null;
  studentCount: number;
  startsAt: Date;
  meetingUrl: string | null;
  title: string | null;
};

export type AttendanceNeededItem = {
  classId: string;
  className: string;
  sessionId: string;
  sessionStartsAt: Date;
};

export type TeacherTodaySummary = {
  classesTodayCount: number;
  homeworkToReviewCount: number;
  attendanceNeeded: AttendanceNeededItem[];
};

export async function getTeacherDashboardClasses(
  teacherUserId: number
): Promise<TeacherDashboardClass[]> {
  const classes = await db
    .select({
      id: eduClasses.id,
      name: eduClasses.name,
      geckoLevel: eduClasses.geckoLevel,
      scheduleDays: eduClasses.scheduleDays,
      scheduleStartTime: eduClasses.scheduleStartTime,
      scheduleTimezone: eduClasses.scheduleTimezone,
    })
    .from(eduClassTeachers)
    .innerJoin(eduClasses, eq(eduClassTeachers.classId, eduClasses.id))
    .where(and(eq(eduClassTeachers.teacherUserId, teacherUserId), eq(eduClassTeachers.isActive, true)))
    .orderBy(asc(eduClasses.name));

  if (classes.length === 0) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
  const classIds = classes.map((c) => c.id);

  const [studentCounts, attemptStats, avgScores] = await Promise.all([
    db
      .select({
        classId: eduEnrollments.classId,
        count: sql<number>`count(*)::int`,
      })
      .from(eduEnrollments)
      .where(
        and(
          eq(eduEnrollments.status, 'active'),
          inArray(eduEnrollments.classId, classIds)
        )
      )
      .groupBy(eduEnrollments.classId),
    db
      .select({
        classId: eduQuizClasses.classId,
        attempted: sql<number>`count(distinct ${eduQuizSubmissions.studentUserId})::int`,
      })
      .from(eduQuizSubmissions)
      .innerJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizSubmissions.quizId))
      .innerJoin(eduEnrollments, and(
        eq(eduEnrollments.classId, eduQuizClasses.classId),
        eq(eduEnrollments.studentUserId, eduQuizSubmissions.studentUserId),
        eq(eduEnrollments.status, 'active')
      ))
      .where(
        and(
          inArray(eduQuizClasses.classId, classIds),
          gte(eduQuizSubmissions.submittedAt, thirtyDaysAgo)
        )
      )
      .groupBy(eduQuizClasses.classId),
    db
      .select({
        classId: eduQuizClasses.classId,
        avgScore: sql<number>`avg(${eduQuizSubmissions.score})::float`,
        attempts30d: sql<number>`count(*)::int`,
      })
      .from(eduQuizSubmissions)
      .innerJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizSubmissions.quizId))
      .innerJoin(eduEnrollments, and(
        eq(eduEnrollments.classId, eduQuizClasses.classId),
        eq(eduEnrollments.studentUserId, eduQuizSubmissions.studentUserId),
        eq(eduEnrollments.status, 'active')
      ))
      .where(
        and(
          inArray(eduQuizClasses.classId, classIds),
          gte(eduQuizSubmissions.submittedAt, thirtyDaysAgo)
        )
      )
      .groupBy(eduQuizClasses.classId),
  ]);

  const studentMap = new Map(studentCounts.map((r) => [r.classId, r.count]));
  const attemptedMap = new Map(attemptStats.map((r) => [r.classId, r.attempted]));
  const avgMap = new Map(
    avgScores.map((r) => [
      r.classId,
      {
        avg: r.avgScore != null ? Math.round(Number(r.avgScore)) : null,
        attempts: r.attempts30d ?? 0,
      },
    ])
  );

  return classes.map((c) => {
    const studentCount = studentMap.get(c.id) ?? 0;
    const attempted = attemptedMap.get(c.id) ?? 0;
    const attemptRate = studentCount > 0 ? Math.round((attempted / studentCount) * 100) : 0;
    const status: 'on_track' | 'needs_attention' =
      studentCount > 0 && attemptRate < ATTEMPT_THRESHOLD
        ? 'needs_attention'
        : 'on_track';
    const { avg: avgScore30d, attempts: attempts30d } = avgMap.get(c.id) ?? {
      avg: null,
      attempts: 0,
    };
    return {
      ...c,
      studentCount,
      status,
      avgScore30d,
      attempts30d,
    };
  });
}

export async function getTeacherDashboardKpis(
  teacherUserId: number
): Promise<TeacherDashboardKpis> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
  const fourteenDaysAgo = new Date(now.getTime() - FOURTEEN_DAYS_MS);

  const classIds = (
    await db
      .select({ classId: eduClassTeachers.classId })
      .from(eduClassTeachers)
      .where(and(eq(eduClassTeachers.teacherUserId, teacherUserId), eq(eduClassTeachers.isActive, true)))
  ).map((r) => r.classId);

  if (classIds.length === 0) {
    return { avgQuizScore30d: null, attemptRate30d: 0, inactiveStudents: 0 };
  }

  const [avgScore, completionData, inactiveCount] = await Promise.all([
    db
      .select({
        avg: sql<number>`avg(${eduQuizSubmissions.score})::float`,
      })
      .from(eduQuizSubmissions)
      .innerJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizSubmissions.quizId))
      .where(
        and(
          inArray(eduQuizClasses.classId, classIds),
          gte(eduQuizSubmissions.submittedAt, thirtyDaysAgo)
        )
      ),
    db
      .select({
        attempted: sql<number>`count(distinct ${eduQuizSubmissions.studentUserId})::int`,
      })
      .from(eduQuizSubmissions)
      .innerJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizSubmissions.quizId))
      .innerJoin(eduEnrollments, and(
        eq(eduEnrollments.classId, eduQuizClasses.classId),
        eq(eduEnrollments.studentUserId, eduQuizSubmissions.studentUserId),
        eq(eduEnrollments.status, 'active')
      ))
      .where(
        and(
          inArray(eduQuizClasses.classId, classIds),
          gte(eduQuizSubmissions.submittedAt, thirtyDaysAgo)
        )
      ),
    db
      .select({
        total: sql<number>`count(distinct ${eduEnrollments.studentUserId})::int`,
      })
      .from(eduEnrollments)
      .where(
        and(
          eq(eduEnrollments.status, 'active'),
          inArray(eduEnrollments.classId, classIds)
        )
      ),
  ]);

  const studentsWithAttempts = completionData[0]?.attempted ?? 0;
  const totalStudents = inactiveCount[0]?.total ?? 0;
  const attemptRate30d =
    totalStudents > 0 ? Math.round((studentsWithAttempts / totalStudents) * 100) : 0;

  const avgVal = avgScore[0]?.avg;
  const avgQuizScore30d =
    avgVal != null ? Math.round(Number(avgVal)) : null;

  const studentsWithRecentAttempts = await db
    .selectDistinct({ studentId: eduQuizSubmissions.studentUserId })
    .from(eduQuizSubmissions)
    .innerJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizSubmissions.quizId))
    .innerJoin(eduEnrollments, and(
      eq(eduEnrollments.classId, eduQuizClasses.classId),
      eq(eduEnrollments.studentUserId, eduQuizSubmissions.studentUserId),
      eq(eduEnrollments.status, 'active')
    ))
    .where(
      and(
        inArray(eduQuizClasses.classId, classIds),
        gte(eduQuizSubmissions.submittedAt, fourteenDaysAgo)
      )
    );
  const recentSet = new Set(studentsWithRecentAttempts.map((r) => r.studentId));
  const allEnrolled = await db
    .select({
      studentId: eduEnrollments.studentUserId,
    })
    .from(eduEnrollments)
    .where(
      and(
        eq(eduEnrollments.status, 'active'),
        inArray(eduEnrollments.classId, classIds)
      )
    );
  const inactiveStudentIds = new Set(
    allEnrolled.filter((r) => !recentSet.has(r.studentId)).map((r) => r.studentId)
  );
  const inactiveStudents = inactiveStudentIds.size;

  return {
    avgQuizScore30d,
    attemptRate30d,
    inactiveStudents,
  };
}

export async function getTeacherDashboardNeedsAttention(
  teacherUserId: number
): Promise<TeacherDashboardNeedsAttention> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
  const fourteenDaysAgo = new Date(now.getTime() - FOURTEEN_DAYS_MS);

  const classIds = (
    await db
      .select({ classId: eduClassTeachers.classId })
      .from(eduClassTeachers)
      .where(and(eq(eduClassTeachers.teacherUserId, teacherUserId), eq(eduClassTeachers.isActive, true)))
  ).map((r) => r.classId);

  if (classIds.length === 0) {
    return { inactiveStudents: [], lowCompletionQuizzes: [] };
  }

  const studentsWithRecentAttempts = await db
    .selectDistinct({ studentId: eduQuizSubmissions.studentUserId })
    .from(eduQuizSubmissions)
    .innerJoin(eduQuizClasses, eq(eduQuizClasses.quizId, eduQuizSubmissions.quizId))
    .innerJoin(eduEnrollments, and(
      eq(eduEnrollments.classId, eduQuizClasses.classId),
      eq(eduEnrollments.studentUserId, eduQuizSubmissions.studentUserId),
      eq(eduEnrollments.status, 'active')
    ))
    .where(
      and(
        inArray(eduQuizClasses.classId, classIds),
        gte(eduQuizSubmissions.submittedAt, fourteenDaysAgo)
      )
    );
  const recentSet = new Set(studentsWithRecentAttempts.map((r) => r.studentId));

  const inactiveRows = await db
    .select({
      studentId: eduEnrollments.studentUserId,
      classId: eduEnrollments.classId,
      studentName: users.name,
    })
    .from(eduEnrollments)
    .innerJoin(users, eq(eduEnrollments.studentUserId, users.id))
    .where(
      and(
        eq(eduEnrollments.status, 'active'),
        inArray(eduEnrollments.classId, classIds)
      )
    );

  const inactiveStudents = inactiveRows
    .filter((r) => !recentSet.has(r.studentId))
    .slice(0, 3)
    .map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      classId: r.classId,
    }));

  const quizClassRows = await db
    .select({
      quizId: eduQuizClasses.quizId,
      classId: eduQuizClasses.classId,
      quizTitle: eduQuizzes.title,
      className: eduClasses.name,
    })
    .from(eduQuizClasses)
    .innerJoin(eduQuizzes, eq(eduQuizzes.id, eduQuizClasses.quizId))
    .innerJoin(eduClasses, eq(eduClasses.id, eduQuizClasses.classId))
    .where(
      and(
        eq(eduQuizzes.status, 'PUBLISHED'),
        inArray(eduQuizClasses.classId, classIds)
      )
    );

  const lowCompletionQuizzes: { quizId: string; quizTitle: string; className: string; attemptPct: number }[] = [];

  for (const row of quizClassRows) {
    const [enrolled] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(eduEnrollments)
      .where(
        and(
          eq(eduEnrollments.classId, row.classId),
          eq(eduEnrollments.status, 'active')
        )
      );
    const [attempted] = await db
      .select({
        count: sql<number>`count(distinct ${eduQuizSubmissions.studentUserId})::int`,
      })
      .from(eduQuizSubmissions)
      .innerJoin(eduEnrollments, and(
        eq(eduEnrollments.classId, row.classId),
        eq(eduEnrollments.studentUserId, eduQuizSubmissions.studentUserId),
        eq(eduEnrollments.status, 'active')
      ))
      .where(
        and(
          eq(eduQuizSubmissions.quizId, row.quizId),
          gte(eduQuizSubmissions.submittedAt, thirtyDaysAgo)
        )
      );
    const total = enrolled?.count ?? 0;
    const a = attempted?.count ?? 0;
    const attemptPct = total > 0 ? Math.round((a / total) * 100) : 0;
    if (total > 0 && attemptPct < ATTEMPT_THRESHOLD) {
      lowCompletionQuizzes.push({
        quizId: row.quizId,
        quizTitle: row.quizTitle,
        className: row.className,
        attemptPct,
      });
    }
    if (lowCompletionQuizzes.length >= 3) break;
  }

  return {
    inactiveStudents,
    lowCompletionQuizzes: lowCompletionQuizzes.slice(0, 3),
  };
}

export async function getTeacherNextSession(
  teacherUserId: number
): Promise<TeacherNextSession | null> {
  const now = new Date();
  const classIds = (
    await db
      .select({ classId: eduClassTeachers.classId })
      .from(eduClassTeachers)
      .where(
        and(
          eq(eduClassTeachers.teacherUserId, teacherUserId),
          eq(eduClassTeachers.isActive, true)
        )
      )
  ).map((r) => r.classId);

  if (classIds.length === 0) return null;

  const [row] = await db
    .select({
      sessionId: eduSessions.id,
      classId: eduClasses.id,
      className: eduClasses.name,
      geckoLevel: eduClasses.geckoLevel,
      startsAt: eduSessions.startsAt,
      meetingUrl: eduSessions.meetingUrl,
      title: eduSessions.title,
    })
    .from(eduSessions)
    .innerJoin(eduClasses, eq(eduSessions.classId, eduClasses.id))
    .where(
      and(
        inArray(eduSessions.classId, classIds),
        gte(eduSessions.startsAt, now)
      )
    )
    .orderBy(asc(eduSessions.startsAt))
    .limit(1);

  if (!row) return null;

  const [studentCountRow] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(eduEnrollments)
    .where(
      and(
        eq(eduEnrollments.classId, row.classId),
        eq(eduEnrollments.status, 'active')
      )
    );

  return {
    sessionId: row.sessionId,
    classId: row.classId,
    className: row.className,
    geckoLevel: row.geckoLevel,
    studentCount: studentCountRow?.count ?? 0,
    startsAt: row.startsAt,
    meetingUrl: row.meetingUrl,
    title: row.title,
  };
}

/** Sessions (class_sessions) that have passed but attendance has not been taken or is incomplete. */
export async function getSessionsNeedingAttendance(
  teacherUserId: number
): Promise<AttendanceNeededItem[]> {
  const now = new Date();
  const classIds = (
    await db
      .select({ classId: eduClassTeachers.classId })
      .from(eduClassTeachers)
      .where(
        and(
          eq(eduClassTeachers.teacherUserId, teacherUserId),
          eq(eduClassTeachers.isActive, true)
        )
      )
  ).map((r) => r.classId);

  if (classIds.length === 0) return [];

  const pastSessions = await db
    .select({
      sessionId: classSessions.id,
      classId: classSessions.classId,
      className: eduClasses.name,
      startsAt: classSessions.startsAt,
    })
    .from(classSessions)
    .innerJoin(eduClasses, eq(classSessions.classId, eduClasses.id))
    .where(
      and(
        inArray(classSessions.classId, classIds),
        lt(classSessions.startsAt, now)
      )
    )
    .orderBy(desc(classSessions.startsAt));

  const result: AttendanceNeededItem[] = [];

  for (const s of pastSessions) {
    const [enrolled] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eduEnrollments)
      .where(
        and(
          eq(eduEnrollments.classId, s.classId),
          eq(eduEnrollments.status, 'active')
        )
      );

    const [recordCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, s.sessionId));

    const rosterCount = enrolled?.count ?? 0;
    const markedCount = recordCount?.count ?? 0;
    const needsAttendance = rosterCount > 0 && markedCount < rosterCount;

    if (needsAttendance) {
      result.push({
        classId: s.classId,
        className: s.className,
        sessionId: s.sessionId,
        sessionStartsAt: s.startsAt,
      });
    }
  }

  return result.slice(0, 10);
}

/** Homework submissions without feedback, for classes teacher teaches. */
export async function getHomeworkToReviewCount(
  teacherUserId: number
): Promise<number> {
  const classIds = (
    await db
      .select({ classId: eduClassTeachers.classId })
      .from(eduClassTeachers)
      .where(
        and(
          eq(eduClassTeachers.teacherUserId, teacherUserId),
          eq(eduClassTeachers.isActive, true)
        )
      )
  ).map((r) => r.classId);

  if (classIds.length === 0) return 0;

  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(homeworkSubmissions)
    .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
    .where(
      and(
        inArray(homework.classId, classIds),
        isNull(homeworkSubmissions.feedback)
      )
    );

  return row?.count ?? 0;
}

/** Today's summary: classes today, homework to review, attendance needed. */
export async function getTeacherTodaySummary(
  teacherUserId: number
): Promise<TeacherTodaySummary> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const classIds = (
    await db
      .select({ classId: eduClassTeachers.classId })
      .from(eduClassTeachers)
      .where(
        and(
          eq(eduClassTeachers.teacherUserId, teacherUserId),
          eq(eduClassTeachers.isActive, true)
        )
      )
  ).map((r) => r.classId);

  if (classIds.length === 0) {
    return { classesTodayCount: 0, homeworkToReviewCount: 0, attendanceNeeded: [] };
  }

  const [classesTodayRows, homeworkCount, attendanceNeeded] = await Promise.all([
    db
      .select({ count: sql<number>`count(distinct ${eduSessions.classId})::int` })
      .from(eduSessions)
      .where(
        and(
          inArray(eduSessions.classId, classIds),
          gte(eduSessions.startsAt, todayStart),
          lt(eduSessions.startsAt, todayEnd)
        )
      ),
    getHomeworkToReviewCount(teacherUserId),
    getSessionsNeedingAttendance(teacherUserId),
  ]);

  return {
    classesTodayCount: classesTodayRows[0]?.count ?? 0,
    homeworkToReviewCount: homeworkCount,
    attendanceNeeded,
  };
}
