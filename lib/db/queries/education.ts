import { eq, gte, lte, and, desc, isNull, isNotNull, asc, or, ilike, inArray, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import {
  eduClasses,
  eduClassTeachers,
  eduEnrollments,
  eduSessions,
  users,
  classroomPosts,
} from '../schema';
import type { PlatformRole } from '../schema';

export type CreateClassData = {
  name: string;
  description?: string;
  level?: string;
  timezone?: string;
  joinCode: string;
  joinCodeEnabled?: boolean;
};

export type UpdateClassData = Partial<Omit<CreateClassData, 'joinCode'>> & {
  joinCode?: string;
  joinCodeEnabled?: boolean;
  geckoLevel?: string | null;
  scheduleDays?: string[] | null;
  scheduleStartTime?: string | null;
  scheduleTimezone?: string | null;
  scheduleStartDate?: Date | string | null;
  scheduleEndDate?: Date | string | null;
  defaultMeetingUrl?: string | null;
};

export type CreateSessionData = {
  classId: string;
  startsAt: Date;
  endsAt: Date;
  meetingUrl?: string | null;
  title?: string | null;
  kind?: 'extra' | 'override' | 'cancel' | null;
  originalStartsAt?: Date | null;
};

export async function createClass(data: CreateClassData) {
  const [created] = await db
    .insert(eduClasses)
    .values({
      name: data.name,
      description: data.description ?? null,
      level: data.level ?? null,
      timezone: data.timezone ?? 'Asia/Ulaanbaatar',
      joinCode: data.joinCode,
      joinCodeEnabled: data.joinCodeEnabled ?? true,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

function toDateString(v: Date | string | null | undefined): string | null | undefined {
  if (v == null) return v;
  if (typeof v === 'string') return v;
  return v.toISOString().slice(0, 10);
}

export async function updateClass(
  id: string,
  data: UpdateClassData
) {
  const {
    scheduleStartDate,
    scheduleEndDate,
    ...rest
  } = data;
  const [updated] = await db
    .update(eduClasses)
    .set({
      ...rest,
      scheduleStartDate: toDateString(scheduleStartDate),
      scheduleEndDate: toDateString(scheduleEndDate),
      updatedAt: new Date(),
    })
    .where(eq(eduClasses.id, id))
    .returning();
  return updated;
}

export async function listClasses() {
  return db
    .select()
    .from(eduClasses)
    .orderBy(desc(eduClasses.createdAt));
}

export async function getClassById(id: string) {
  const [row] = await db
    .select()
    .from(eduClasses)
    .where(eq(eduClasses.id, id))
    .limit(1);
  return row ?? null;
}

export async function getClassByJoinCode(joinCode: string) {
  const normalized = joinCode.trim().toUpperCase();
  if (!normalized) return null;
  const [row] = await db
    .select()
    .from(eduClasses)
    .where(eq(eduClasses.joinCode, normalized))
    .limit(1);
  return row ?? null;
}

export async function updateClassJoinCode(
  id: string,
  data: { joinCode?: string; joinCodeEnabled?: boolean }
) {
  const [updated] = await db
    .update(eduClasses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(eduClasses.id, id))
    .returning();
  return updated;
}

export async function createSession(data: CreateSessionData) {
  const [created] = await db
    .insert(eduSessions)
    .values({
      classId: data.classId,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      meetingUrl: data.meetingUrl ?? null,
      title: data.title ?? null,
      kind: data.kind ?? null,
      originalStartsAt: data.originalStartsAt ?? null,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function enrollStudent({
  classId,
  studentUserId,
}: {
  classId: string;
  studentUserId: number;
}) {
  const [created] = await db
    .insert(eduEnrollments)
    .values({
      classId,
      studentUserId,
      status: 'active',
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function assignTeacher({
  classId,
  teacherUserId,
}: {
  classId: string;
  teacherUserId: number;
}) {
  const [created] = await db
    .insert(eduClassTeachers)
    .values({
      classId,
      teacherUserId,
    })
    .returning();
  return created;
}

export async function listUpcomingSessionsForUser(
  userId: number,
  role: PlatformRole
) {
  const now = new Date();
  const limit = role === 'admin' || role === 'school_admin' ? 20 : 5;

  if (role === 'student') {
    return db
      .select({
        session: eduSessions,
        className: eduClasses.name,
      })
      .from(eduSessions)
      .innerJoin(eduClasses, eq(eduSessions.classId, eduClasses.id))
      .innerJoin(eduEnrollments, eq(eduEnrollments.classId, eduClasses.id))
      .where(
        and(
          eq(eduEnrollments.studentUserId, userId),
          eq(eduEnrollments.status, 'active'),
          gte(eduSessions.startsAt, now)
        )
      )
      .orderBy(eduSessions.startsAt)
      .limit(limit);
  }

  if (role === 'teacher') {
    return db
      .select({
        session: eduSessions,
        className: eduClasses.name,
      })
      .from(eduSessions)
      .innerJoin(eduClasses, eq(eduSessions.classId, eduClasses.id))
      .innerJoin(eduClassTeachers, eq(eduClassTeachers.classId, eduClasses.id))
      .where(
        and(
          eq(eduClassTeachers.teacherUserId, userId),
          gte(eduSessions.startsAt, now)
        )
      )
      .orderBy(eduSessions.startsAt)
      .limit(limit);
  }

  if (role === 'admin' || role === 'school_admin') {
    return db
      .select({
        session: eduSessions,
        className: eduClasses.name,
      })
      .from(eduSessions)
      .innerJoin(eduClasses, eq(eduSessions.classId, eduClasses.id))
      .where(gte(eduSessions.startsAt, now))
      .orderBy(eduSessions.startsAt)
      .limit(limit);
  }

  return [];
}

export async function listSessionsByClassId(classId: string) {
  return db
    .select()
    .from(eduSessions)
    .where(eq(eduSessions.classId, classId))
    .orderBy(eduSessions.startsAt);
}

/** Classes assigned to teacher via class_teachers (unique). */
export async function listClassesForTeacher(teacherUserId: number) {
  return db
    .select({
      id: eduClasses.id,
      name: eduClasses.name,
      level: eduClasses.level,
      timezone: eduClasses.timezone,
    })
    .from(eduClassTeachers)
    .innerJoin(eduClasses, eq(eduClassTeachers.classId, eduClasses.id))
    .where(eq(eduClassTeachers.teacherUserId, teacherUserId))
    .orderBy(asc(eduClasses.name));
}

/** Classes assigned to teacher with schedule + student count (active enrollments). */
export async function getClassesForTeacherWithDetails(teacherUserId: number) {
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
    .where(eq(eduClassTeachers.teacherUserId, teacherUserId))
    .orderBy(asc(eduClasses.name));

  const studentCountRows = await db
    .select({
      classId: eduEnrollments.classId,
      count: sql<number>`count(*)::int`,
    })
    .from(eduEnrollments)
    .where(eq(eduEnrollments.status, 'active'))
    .groupBy(eduEnrollments.classId);

  const countMap = new Map(studentCountRows.map((r) => [r.classId, r.count]));
  return classes.map((c) => ({
    ...c,
    studentCount: countMap.get(c.id) ?? 0,
  }));
}

/** All classes with schedule, student count, and teachers (for school_admin). */
export async function getClassesForSchoolAdminWithDetails() {
  const classes = await db
    .select({
      id: eduClasses.id,
      name: eduClasses.name,
      geckoLevel: eduClasses.geckoLevel,
      scheduleDays: eduClasses.scheduleDays,
      scheduleStartTime: eduClasses.scheduleStartTime,
      scheduleTimezone: eduClasses.scheduleTimezone,
    })
    .from(eduClasses)
    .orderBy(asc(eduClasses.name));

  const [studentCountRows, teacherRows] = await Promise.all([
    db
      .select({
        classId: eduEnrollments.classId,
        count: sql<number>`count(*)::int`,
      })
      .from(eduEnrollments)
      .where(eq(eduEnrollments.status, 'active'))
      .groupBy(eduEnrollments.classId),
    db
      .select({
        classId: eduClassTeachers.classId,
        teacherUserId: eduClassTeachers.teacherUserId,
        teacherName: users.name,
        teacherEmail: users.email,
      })
      .from(eduClassTeachers)
      .innerJoin(users, eq(eduClassTeachers.teacherUserId, users.id))
      .where(isNull(users.deletedAt)),
  ]);

  const countMap = new Map(studentCountRows.map((r) => [r.classId, r.count]));
  const teachersByClass = new Map<string, { id: number; name: string | null; email: string }[]>();
  for (const t of teacherRows) {
    const list = teachersByClass.get(t.classId) ?? [];
    list.push({
      id: t.teacherUserId,
      name: t.teacherName,
      email: t.teacherEmail,
    });
    teachersByClass.set(t.classId, list);
  }

  return classes.map((c) => ({
    ...c,
    studentCount: countMap.get(c.id) ?? 0,
    teachers: teachersByClass.get(c.id) ?? [],
  }));
}

/** Upcoming sessions for classes the teacher is assigned to. */
export async function listUpcomingSessionsForTeacher(
  teacherUserId: number,
  limit = 10
) {
  const now = new Date();
  return db
    .select({
      session: eduSessions,
      className: eduClasses.name,
      classId: eduClasses.id,
    })
    .from(eduSessions)
    .innerJoin(eduClasses, eq(eduSessions.classId, eduClasses.id))
    .innerJoin(eduClassTeachers, eq(eduClassTeachers.classId, eduClasses.id))
    .where(
      and(
        eq(eduClassTeachers.teacherUserId, teacherUserId),
        gte(eduSessions.startsAt, now)
      )
    )
    .orderBy(asc(eduSessions.startsAt))
    .limit(limit);
}

/** Active enrollments for a student with class details. */
export async function getActiveEnrollmentsForStudent(studentUserId: number) {
  return db
    .select({
      enrollment: eduEnrollments,
      class: eduClasses,
    })
    .from(eduEnrollments)
    .innerJoin(eduClasses, eq(eduEnrollments.classId, eduClasses.id))
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active')
      )
    )
    .orderBy(desc(eduEnrollments.createdAt));
}

/** Primary class = most recent active enrollment's class, or null. */
export async function getPrimaryClassForStudent(studentUserId: number) {
  const rows = await getActiveEnrollmentsForStudent(studentUserId);
  return rows.length > 0 ? rows[0].class : null;
}

/** Class plus upcoming sessions (startsAt >= now), ordered ascending, limited. */
export async function getClassWithUpcomingSessions(
  classId: string,
  limit = 10
) {
  const now = new Date();
  const [classRow] = await db
    .select()
    .from(eduClasses)
    .where(eq(eduClasses.id, classId))
    .limit(1);
  if (!classRow) return null;
  const sessions = await db
    .select()
    .from(eduSessions)
    .where(
      and(eq(eduSessions.classId, classId), gte(eduSessions.startsAt, now))
    )
    .orderBy(asc(eduSessions.startsAt))
    .limit(limit);
  return { class: classRow, sessions };
}

/** Returns true if student is actively enrolled in the class. */
export async function isStudentEnrolledInClass(
  studentUserId: number,
  classId: string
) {
  const [row] = await db
    .select()
    .from(eduEnrollments)
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.classId, classId),
        eq(eduEnrollments.status, 'active')
      )
    )
    .limit(1);
  return !!row;
}

export type StudentDashboardData =
  | {
      hasClasses: true;
      primaryClass: typeof eduClasses.$inferSelect;
      nextSessions: Array<{ session: typeof eduSessions.$inferSelect; className: string }>;
      otherClasses: Array<typeof eduClasses.$inferSelect>;
    }
  | { hasClasses: false };

/** Dashboard payload for student: primary class, next sessions, other classes or empty. */
export async function getStudentDashboardData(
  studentUserId: number
): Promise<StudentDashboardData> {
  const enrollments = await getActiveEnrollmentsForStudent(studentUserId);
  if (enrollments.length === 0) {
    return { hasClasses: false };
  }
  const primaryClass = enrollments[0].class;
  const otherClasses = enrollments.slice(1).map((r) => r.class);
  const now = new Date();
  const nextSessionsRows = await db
    .select({
      session: eduSessions,
      className: eduClasses.name,
    })
    .from(eduSessions)
    .innerJoin(eduClasses, eq(eduSessions.classId, eduClasses.id))
    .innerJoin(eduEnrollments, eq(eduEnrollments.classId, eduClasses.id))
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active'),
        gte(eduSessions.startsAt, now)
      )
    )
    .orderBy(asc(eduSessions.startsAt))
    .limit(5);
  return {
    hasClasses: true,
    primaryClass,
    nextSessions: nextSessionsRows,
    otherClasses,
  };
}

export async function listEnrollmentsByClassId(classId: string) {
  return db
    .select({
      enrollment: eduEnrollments,
      studentId: eduEnrollments.studentUserId,
      studentEmail: users.email,
      studentName: users.name,
    })
    .from(eduEnrollments)
    .innerJoin(users, eq(eduEnrollments.studentUserId, users.id))
    .where(eq(eduEnrollments.classId, classId));
}

export async function listTeachersByClassId(classId: string) {
  return db
    .select({
      classTeacher: eduClassTeachers,
      teacherUserId: eduClassTeachers.teacherUserId,
      teacherEmail: users.email,
      teacherName: users.name,
    })
    .from(eduClassTeachers)
    .innerJoin(users, eq(eduClassTeachers.teacherUserId, users.id))
    .where(eq(eduClassTeachers.classId, classId));
}

export async function hasEnrollment(classId: string, studentUserId: number) {
  const [row] = await db
    .select()
    .from(eduEnrollments)
    .where(
      and(
        eq(eduEnrollments.classId, classId),
        eq(eduEnrollments.studentUserId, studentUserId)
      )
    )
    .limit(1);
  return !!row;
}

/** True if student has active enrollment in class. */
export async function hasActiveEnrollment(classId: string, studentUserId: number) {
  const [row] = await db
    .select()
    .from(eduEnrollments)
    .where(
      and(
        eq(eduEnrollments.classId, classId),
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active')
      )
    )
    .limit(1);
  return !!row;
}

/** Set all active enrollments for student to ended. Enforce one active class per student. */
export async function endActiveEnrollmentsForStudent(studentUserId: number) {
  return db
    .update(eduEnrollments)
    .set({ status: 'ended', updatedAt: new Date() })
    .where(
      and(
        eq(eduEnrollments.studentUserId, studentUserId),
        eq(eduEnrollments.status, 'active')
      )
    )
    .returning();
}

/** Update enrollment status. Returns updated row or null if not found. */
export async function updateEnrollmentStatus(
  classId: string,
  studentUserId: number,
  status: 'active' | 'paused' | 'ended'
) {
  const [updated] = await db
    .update(eduEnrollments)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(eduEnrollments.classId, classId),
        eq(eduEnrollments.studentUserId, studentUserId)
      )
    )
    .returning();
  return updated ?? null;
}

export async function hasTeacherAssignment(classId: string, teacherUserId: number) {
  const [row] = await db
    .select()
    .from(eduClassTeachers)
    .where(
      and(
        eq(eduClassTeachers.classId, classId),
        eq(eduClassTeachers.teacherUserId, teacherUserId)
      )
    )
    .limit(1);
  return !!row;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  return user ?? null;
}

/** Get user by id; returns null if deleted. Use for validation only. */
export async function getUserById(userId: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
  return user ?? null;
}

/** Soft delete / deactivate user by setting deletedAt. Requires users:write. */
export async function deactivateUser(userId: number): Promise<boolean> {
  const [updated] = await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return !!updated;
}

/** Archive user (set archivedAt). Hidden from default listings. */
export async function archiveUser(userId: number): Promise<boolean> {
  const [updated] = await db
    .update(users)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return !!updated;
}

/** Unarchive user (clear archivedAt). */
export async function unarchiveUser(userId: number): Promise<boolean> {
  const [updated] = await db
    .update(users)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return !!updated;
}

/** All enrollments for a student with class details (active, paused, ended). */
export async function getAllEnrollmentsForStudent(studentUserId: number) {
  return db
    .select({
      enrollment: eduEnrollments,
      class: eduClasses,
    })
    .from(eduEnrollments)
    .innerJoin(eduClasses, eq(eduEnrollments.classId, eduClasses.id))
    .where(eq(eduEnrollments.studentUserId, studentUserId))
    .orderBy(desc(eduEnrollments.createdAt));
}

/** Class info for classroom header. */
export async function getClassroomHeader(classId: string) {
  return getClassById(classId);
}

/** Posts for a class, newest first. */
/** Student and teacher user IDs in class (for notification recipients). */
export async function getClassNotificationRecipients(classId: string): Promise<{
  studentUserIds: number[];
  teacherUserIds: number[];
}> {
  const [students, teachers] = await Promise.all([
    db
      .selectDistinct({ userId: eduEnrollments.studentUserId })
      .from(eduEnrollments)
      .where(
        and(
          eq(eduEnrollments.classId, classId),
          eq(eduEnrollments.status, 'active')
        )
      ),
    db
      .selectDistinct({ userId: eduClassTeachers.teacherUserId })
      .from(eduClassTeachers)
      .where(eq(eduClassTeachers.classId, classId)),
  ]);
  return {
    studentUserIds: students.map((r) => r.userId),
    teacherUserIds: teachers.map((r) => r.userId),
  };
}

export async function listClassroomPosts(classId: string, limit = 50) {
  return db
    .select()
    .from(classroomPosts)
    .where(eq(classroomPosts.classId, classId))
    .orderBy(desc(classroomPosts.createdAt))
    .limit(limit);
}

/** Teacher is assigned to this class. */
export async function teacherAssignedToClass(
  teacherUserId: number,
  classId: string
) {
  return hasTeacherAssignment(classId, teacherUserId);
}

/** Student is actively enrolled in this class. */
export async function studentEnrolledInClass(
  studentUserId: number,
  classId: string
) {
  return isStudentEnrolledInClass(studentUserId, classId);
}

export type CreateClassroomPostData = {
  classId: string;
  authorUserId: number;
  type: string;
  title?: string | null;
  body?: string | null;
  fileUrl?: string | null;
  linkUrl?: string | null;
};

export async function createClassroomPost(data: CreateClassroomPostData) {
  const [created] = await db
    .insert(classroomPosts)
    .values({
      classId: data.classId,
      authorUserId: data.authorUserId,
      type: data.type,
      title: data.title ?? null,
      body: data.body ?? null,
      fileUrl: data.fileUrl ?? null,
      linkUrl: data.linkUrl ?? null,
    })
    .returning();
  return created;
}

/** Schedule summary for user: classes enrolled/assigned with schedule fields. */
export async function getScheduleSummaryForUser(
  userId: number,
  role: PlatformRole
) {
  const baseSelect = {
    id: eduClasses.id,
    name: eduClasses.name,
    geckoLevel: eduClasses.geckoLevel,
    scheduleDays: eduClasses.scheduleDays,
    scheduleStartTime: eduClasses.scheduleStartTime,
    scheduleTimezone: eduClasses.scheduleTimezone,
    durationMinutes: eduClasses.durationMinutes,
    defaultMeetingUrl: eduClasses.defaultMeetingUrl,
  };

  if (role === 'student') {
    return db
      .select(baseSelect)
      .from(eduEnrollments)
      .innerJoin(eduClasses, eq(eduEnrollments.classId, eduClasses.id))
      .where(
        and(
          eq(eduEnrollments.studentUserId, userId),
          eq(eduEnrollments.status, 'active')
        )
      )
      .orderBy(asc(eduClasses.name));
  }

  if (role === 'teacher') {
    return db
      .select(baseSelect)
      .from(eduClassTeachers)
      .innerJoin(eduClasses, eq(eduClassTeachers.classId, eduClasses.id))
      .where(eq(eduClassTeachers.teacherUserId, userId))
      .orderBy(asc(eduClasses.name));
  }

  if (role === 'admin' || role === 'school_admin') {
    return db
      .select(baseSelect)
      .from(eduClasses)
      .orderBy(asc(eduClasses.name));
  }

  return [];
}

/** Classes with recurring schedule for calendar, by role (student=enrolled, teacher=assigned, school_admin=all). */
export async function getClassesWithScheduleForCalendar(
  userId: number,
  role: PlatformRole
) {
  const hasSchedule = and(
    isNotNull(eduClasses.scheduleDays),
    isNotNull(eduClasses.scheduleStartTime),
    isNotNull(eduClasses.scheduleTimezone),
    isNotNull(eduClasses.scheduleStartDate)
  );

  if (role === 'student') {
    return db
      .select({
        id: eduClasses.id,
        name: eduClasses.name,
        geckoLevel: eduClasses.geckoLevel,
        scheduleDays: eduClasses.scheduleDays,
        scheduleStartTime: eduClasses.scheduleStartTime,
        scheduleTimezone: eduClasses.scheduleTimezone,
        scheduleStartDate: eduClasses.scheduleStartDate,
        scheduleEndDate: eduClasses.scheduleEndDate,
        durationMinutes: eduClasses.durationMinutes,
        defaultMeetingUrl: eduClasses.defaultMeetingUrl,
      })
      .from(eduEnrollments)
      .innerJoin(eduClasses, eq(eduEnrollments.classId, eduClasses.id))
      .where(
        and(
          eq(eduEnrollments.studentUserId, userId),
          eq(eduEnrollments.status, 'active'),
          hasSchedule
        )
      )
      .orderBy(asc(eduClasses.name));
  }

  if (role === 'teacher') {
    return db
      .select({
        id: eduClasses.id,
        name: eduClasses.name,
        geckoLevel: eduClasses.geckoLevel,
        scheduleDays: eduClasses.scheduleDays,
        scheduleStartTime: eduClasses.scheduleStartTime,
        scheduleTimezone: eduClasses.scheduleTimezone,
        scheduleStartDate: eduClasses.scheduleStartDate,
        scheduleEndDate: eduClasses.scheduleEndDate,
        durationMinutes: eduClasses.durationMinutes,
        defaultMeetingUrl: eduClasses.defaultMeetingUrl,
      })
      .from(eduClassTeachers)
      .innerJoin(eduClasses, eq(eduClassTeachers.classId, eduClasses.id))
      .where(and(eq(eduClassTeachers.teacherUserId, userId), hasSchedule))
      .orderBy(asc(eduClasses.name));
  }

  if (role === 'admin' || role === 'school_admin') {
    return db
      .select({
        id: eduClasses.id,
        name: eduClasses.name,
        geckoLevel: eduClasses.geckoLevel,
        scheduleDays: eduClasses.scheduleDays,
        scheduleStartTime: eduClasses.scheduleStartTime,
        scheduleTimezone: eduClasses.scheduleTimezone,
        scheduleStartDate: eduClasses.scheduleStartDate,
        scheduleEndDate: eduClasses.scheduleEndDate,
        durationMinutes: eduClasses.durationMinutes,
        defaultMeetingUrl: eduClasses.defaultMeetingUrl,
      })
      .from(eduClasses)
      .where(hasSchedule)
      .orderBy(asc(eduClasses.name));
  }

  return [];
}

/** Sessions in UTC range: startsAt in range OR originalStartsAt in range (for overrides/cancels). */
export async function getSessionsInRange(
  classIds: string[],
  rangeStart: Date,
  rangeEnd: Date
) {
  if (classIds.length === 0) return [];
  return db
    .select({
      id: eduSessions.id,
      classId: eduSessions.classId,
      startsAt: eduSessions.startsAt,
      endsAt: eduSessions.endsAt,
      meetingUrl: eduSessions.meetingUrl,
      title: eduSessions.title,
      kind: eduSessions.kind,
      originalStartsAt: eduSessions.originalStartsAt,
    })
    .from(eduSessions)
    .where(
      and(
        inArray(eduSessions.classId, classIds),
        or(
          and(
            gte(eduSessions.startsAt, rangeStart),
            lte(eduSessions.startsAt, rangeEnd)
          ),
          and(
            isNotNull(eduSessions.originalStartsAt),
            gte(eduSessions.originalStartsAt, rangeStart),
            lte(eduSessions.originalStartsAt, rangeEnd)
          )
        )
      )
    )
    .orderBy(asc(eduSessions.startsAt));
}

/** Students enrolled in all classes (for school_admin). */
export async function getStudentsForSchoolAdmin(filters?: {
  classId?: string;
  search?: string;
}) {
  const conditions = [isNull(users.deletedAt), isNull(users.archivedAt)];
  if (filters?.classId) conditions.push(eq(eduClasses.id, filters.classId));
  if (filters?.search?.trim()) {
    const pattern = `%${filters.search.trim()}%`;
    conditions.push(
      or(ilike(users.name, pattern), ilike(users.email, pattern))!
    );
  }

  return db
    .select({
      studentId: eduEnrollments.studentUserId,
      studentName: users.name,
      studentEmail: users.email,
      classId: eduClasses.id,
      className: eduClasses.name,
      geckoLevel: eduClasses.geckoLevel,
      enrollmentStatus: eduEnrollments.status,
    })
    .from(eduEnrollments)
    .innerJoin(eduClasses, eq(eduEnrollments.classId, eduClasses.id))
    .innerJoin(users, eq(eduEnrollments.studentUserId, users.id))
    .where(and(...conditions))
    .orderBy(asc(users.name), asc(eduClasses.name));
}

/** Students enrolled in classes where teacher is assigned. Server-scoped by teacherUserId. */
export async function getStudentsForTeacher(
  teacherUserId: number,
  filters?: { classId?: string; search?: string }
) {
  const conditions = [
    eq(eduClassTeachers.teacherUserId, teacherUserId),
    isNull(users.deletedAt),
    isNull(users.archivedAt),
  ];
  if (filters?.classId) {
    conditions.push(eq(eduClasses.id, filters.classId));
  }
  if (filters?.search?.trim()) {
    const pattern = `%${filters.search.trim()}%`;
    conditions.push(
      or(ilike(users.name, pattern), ilike(users.email, pattern))!
    );
  }

  const rows = await db
    .select({
      studentId: eduEnrollments.studentUserId,
      studentName: users.name,
      studentEmail: users.email,
      classId: eduClasses.id,
      className: eduClasses.name,
      geckoLevel: eduClasses.geckoLevel,
      enrollmentStatus: eduEnrollments.status,
    })
    .from(eduClassTeachers)
    .innerJoin(eduClasses, eq(eduClassTeachers.classId, eduClasses.id))
    .innerJoin(eduEnrollments, eq(eduEnrollments.classId, eduClasses.id))
    .innerJoin(users, eq(eduEnrollments.studentUserId, users.id))
    .where(and(...conditions))
    .orderBy(asc(users.name), asc(eduClasses.name));

  return rows;
}

/** Returns true if student has at least one enrollment (for school_admin - views all classes). */
export async function hasStudentEnrollment(studentUserId: number): Promise<boolean> {
  const [row] = await db
    .select({ studentUserId: eduEnrollments.studentUserId })
    .from(eduEnrollments)
    .where(eq(eduEnrollments.studentUserId, studentUserId))
    .limit(1);
  return !!row;
}

/** Returns true if student is enrolled in any class assigned to the teacher. */
export async function isStudentInTeacherClass(
  teacherUserId: number,
  studentUserId: number
): Promise<boolean> {
  const [row] = await db
    .select({ studentUserId: eduEnrollments.studentUserId })
    .from(eduClassTeachers)
    .innerJoin(eduEnrollments, eq(eduEnrollments.classId, eduClassTeachers.classId))
    .where(
      and(
        eq(eduClassTeachers.teacherUserId, teacherUserId),
        eq(eduEnrollments.studentUserId, studentUserId)
      )
    )
    .limit(1);
  return !!row;
}

/** Teachers assigned to any class (for admin filter dropdown). */
export async function listTeachersForAdmin() {
  return db
    .selectDistinct({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(eduClassTeachers)
    .innerJoin(users, eq(eduClassTeachers.teacherUserId, users.id))
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.name));
}

/** Users for admin directory with filters. Requires classes:read + users:read. */
export async function getUsersForAdmin(filters?: {
  role?: string;
  assignment?: 'all' | 'unassigned' | 'assigned';
  classId?: string;
  geckoLevel?: string;
  search?: string;
  status?: 'active' | 'archived' | 'all';
}) {
  const roleFilter = filters?.role && filters.role !== 'all' ? filters.role : null;
  const statusFilter = filters?.status ?? 'active'; // active = default, exclude archived
  const assignmentFilter = filters?.assignment && filters.assignment !== 'all'
    ? filters.assignment
    : null;
  const searchTerm = filters?.search?.trim();
  const hasClassFilter = !!filters?.classId;
  const hasGeckoFilter = !!filters?.geckoLevel;

  let userIds: number[] | null = null;

  if (assignmentFilter && (roleFilter === 'student' || !roleFilter)) {
    const activeStudentIds = await db
      .selectDistinct({ userId: eduEnrollments.studentUserId })
      .from(eduEnrollments)
      .where(eq(eduEnrollments.status, 'active'))
      .then((rows) => rows.map((r) => r.userId));
    if (assignmentFilter === 'assigned') {
      userIds = activeStudentIds;
      if (userIds.length === 0) return [];
    } else {
      const allStudentIds = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(eq(users.platformRole, 'student'), isNull(users.deletedAt))
        )
        .then((rows) => rows.map((r) => r.id));
      userIds = allStudentIds.filter((id) => !activeStudentIds.includes(id));
      if (userIds.length === 0) return [];
    }
  }

  if (hasClassFilter || hasGeckoFilter) {
    const subqConditions = [eq(users.platformRole, 'student')];
    if (hasClassFilter) subqConditions.push(eq(eduEnrollments.classId, filters.classId!));
    if (hasGeckoFilter) subqConditions.push(eq(eduClasses.geckoLevel, filters.geckoLevel!));

    const subq = await db
      .selectDistinct({ userId: users.id })
      .from(users)
      .innerJoin(eduEnrollments, eq(eduEnrollments.studentUserId, users.id))
      .innerJoin(eduClasses, eq(eduEnrollments.classId, eduClasses.id))
      .where(and(...subqConditions));

    const subqIds = subq.map((r) => r.userId);
    const existingIds = userIds;
    if (existingIds !== null && existingIds.length > 0) {
      userIds = existingIds.filter((id) => subqIds.includes(id));
    } else {
      userIds = subqIds;
    }
    if (userIds.length === 0) return [];
  }

  const baseConditions = [isNull(users.deletedAt)];
  if (statusFilter === 'active') baseConditions.push(isNull(users.archivedAt));
  else if (statusFilter === 'archived') baseConditions.push(isNotNull(users.archivedAt));
  if (userIds && userIds.length > 0) {
    baseConditions.push(inArray(users.id, userIds));
    if (roleFilter && roleFilter !== 'student') return []; // class/gecko/teacher filters only apply to students
  } else if (roleFilter) {
    baseConditions.push(eq(users.platformRole, roleFilter));
  }
  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    baseConditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!);
  }

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      platformRole: users.platformRole,
      archivedAt: users.archivedAt,
    })
    .from(users)
    .where(and(...baseConditions))
    .orderBy(asc(users.name));

  return result;
}

/** Count of active enrollments per student user id. */
export async function getActiveClassesCountByStudent(): Promise<Map<number, number>> {
  const rows = await db
    .select({
      studentUserId: eduEnrollments.studentUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(eduEnrollments)
    .where(eq(eduEnrollments.status, 'active'))
    .groupBy(eduEnrollments.studentUserId);
  return new Map(rows.map((r) => [r.studentUserId, r.count]));
}

/** Count of all enrollments per student user id (legacy). */
export async function getClassesCountByStudent(): Promise<Map<number, number>> {
  const rows = await db
    .select({
      studentUserId: eduEnrollments.studentUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(eduEnrollments)
    .groupBy(eduEnrollments.studentUserId);
  return new Map(rows.map((r) => [r.studentUserId, r.count]));
}

/** Classes with schedule summary for assign dropdown. */
export async function listClassesWithScheduleForAssign() {
  return db
    .select({
      id: eduClasses.id,
      name: eduClasses.name,
      geckoLevel: eduClasses.geckoLevel,
      scheduleDays: eduClasses.scheduleDays,
      scheduleStartTime: eduClasses.scheduleStartTime,
      scheduleTimezone: eduClasses.scheduleTimezone,
    })
    .from(eduClasses)
    .orderBy(asc(eduClasses.name));
}

/** Search users with platformRole = teacher by email or name (ILIKE). */
export async function searchTeachers(query: string, limit = 10) {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q}%`;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        eq(users.platformRole, 'teacher'),
        isNull(users.deletedAt),
        or(
          ilike(users.email, pattern),
          ilike(users.name, pattern)
        )
      )
    )
    .orderBy(asc(users.name))
    .limit(limit);
}
