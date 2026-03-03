'use server';

import { z } from 'zod';
import { PARTICIPATION_MAX } from '@/lib/constants/attendance';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/db/queries';
import { canPostToClassroom } from '@/lib/auth/classroom';
import { getClassById } from '@/lib/db/queries/education';
import {
  getSessionAttendance,
  getStudentAttendanceMonthSummary,
  getStudentAttendanceMonthSessions,
} from '@/lib/db/queries/attendance';
import type { StudentMonthSummary, StudentMonthSessionRow } from '@/lib/db/queries/attendance';
import { db } from '@/lib/db/drizzle';
import { attendanceRecords } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const attendanceStatusSchema = z.enum(['present', 'absent', 'late']);

const attendanceRowSchema = z.object({
  studentUserId: z.number().int().positive(),
  status: attendanceStatusSchema,
  participationScore: z.number().int().min(0).max(PARTICIPATION_MAX).optional().nullable(),
  teacherNote: z.string().max(500).optional().nullable(),
});

const saveAttendanceSchema = z.object({
  classId: z.string().uuid(),
  sessionId: z.string().uuid(),
  rows: z.array(attendanceRowSchema),
});

export type SaveAttendanceResult =
  | { success: true }
  | { success: false; error: string };

export async function saveAttendanceAction(
  _prev: unknown,
  formData: FormData
): Promise<SaveAttendanceResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };

  const classId = formData.get('classId');
  const sessionId = formData.get('sessionId');
  const rowsJson = formData.get('rows');
  if (typeof classId !== 'string' || typeof sessionId !== 'string') {
    return { success: false, error: 'Missing classId or sessionId.' };
  }
  let rows: z.infer<typeof attendanceRowSchema>[];
  try {
    const parsed = JSON.parse(
      typeof rowsJson === 'string' ? rowsJson : '[]'
    ) as unknown;
    const result = z.array(attendanceRowSchema).safeParse(parsed);
    if (!result.success) {
      return {
        success: false,
        error: result.error.errors[0]?.message ?? 'Invalid rows data.',
      };
    }
    rows = result.data;
  } catch {
    return { success: false, error: 'Invalid rows JSON.' };
  }

  const canPost = await canPostToClassroom(user, classId);
  if (!canPost) {
    return { success: false, error: 'You do not have permission to save attendance.' };
  }

  const eduClass = await getClassById(classId);
  if (!eduClass) {
    return { success: false, error: 'Class not found.' };
  }

  const sessionData = await getSessionAttendance(sessionId);
  if (!sessionData) {
    return { success: false, error: 'Session not found.' };
  }
  if (sessionData.session.classId !== classId) {
    return { success: false, error: 'Session does not belong to this class.' };
  }

  const rosterUserIds = new Set(
    sessionData.roster.map((r) => r.studentUserId)
  );
  for (const row of rows) {
    if (!rosterUserIds.has(row.studentUserId)) {
      return {
        success: false,
        error: `Student ${row.studentUserId} is not in the class roster.`,
      };
    }
  }

  const now = new Date();
  const recordMap = new Map(
    sessionData.records.map((r) => [r.studentUserId, r])
  );

  for (const row of rows) {
    const existing = recordMap.get(row.studentUserId);
    const participationScore =
      row.participationScore != null &&
      row.participationScore >= 0 &&
      row.participationScore <= PARTICIPATION_MAX
        ? row.participationScore
        : null;
    const teacherNote =
      row.teacherNote != null && row.teacherNote.trim() !== ''
        ? row.teacherNote.trim()
        : null;

    if (existing) {
      await db
        .update(attendanceRecords)
        .set({
          status: row.status,
          participationScore,
          teacherNote,
          updatedAt: now,
        })
        .where(eq(attendanceRecords.id, existing.id));
    } else {
      await db.insert(attendanceRecords).values({
        sessionId,
        studentUserId: row.studentUserId,
        status: row.status,
        participationScore,
        teacherNote,
        updatedAt: now,
      });
    }
  }

  revalidatePath(`/classroom/${classId}/attendance`);
  return { success: true };
}

export type MonthAttendanceDetails = {
  summary: StudentMonthSummary;
  sessions: StudentMonthSessionRow[];
};

/** Lazy-load attendance details for a given month (student view). User must be the student. */
export async function getMonthAttendanceDetailsAction(
  monthKey: string
): Promise<{ success: true; data: MonthAttendanceDetails } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };

  const monthKeyMatch = /^\d{4}-\d{2}$/.exec(monthKey);
  if (!monthKeyMatch) return { success: false, error: 'Invalid month key.' };

  const [summary, sessions] = await Promise.all([
    getStudentAttendanceMonthSummary(user.id, monthKey),
    getStudentAttendanceMonthSessions(user.id, monthKey),
  ]);

  return {
    success: true,
    data: { summary, sessions },
  };
}
