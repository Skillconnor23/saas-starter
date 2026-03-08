'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/permissions';
import {
  createClass as dbCreateClass,
  createSession as dbCreateSession,
  updateClass as dbUpdateClass,
  enrollStudent as dbEnrollStudent,
  assignTeacher as dbAssignTeacher,
  removeTeacherFromClass as dbRemoveTeacherFromClass,
  getClassByJoinCode,
  updateClassJoinCode,
  getClassById,
  getUserByEmail,
  getUserById,
  hasEnrollment,
  hasActiveEnrollment,
  hasTeacherAssignment,
  searchTeachers,
  updateEnrollmentStatus,
  endActiveEnrollmentsForStudent,
  deactivateUser,
  archiveUser,
  unarchiveUser,
} from '@/lib/db/queries/education';
import { generateJoinCode } from '@/lib/education/join-code';
import { redirect } from 'next/navigation';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import type { PlatformRole } from '@/lib/db/schema';

const createClassSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.string().optional(),
  timezone: z.string().optional(),
  description: z.string().optional(),
  schoolId: z.string().uuid().optional().nullable(),
});

const MAX_JOIN_CODE_RETRIES = 5;

export async function createClassAction(_prev: unknown, formData: FormData) {
  try {
  await requirePermission('classes:write');
  const rawSchoolId = formData.get('schoolId');
  const schoolIdParam =
    typeof rawSchoolId === 'string' && rawSchoolId.trim()
      ? rawSchoolId.trim()
      : undefined;
  const parsed = createClassSchema.safeParse({
    name: formData.get('name'),
    level: formData.get('level') || undefined,
    timezone: formData.get('timezone') || undefined,
    description: formData.get('description') || undefined,
    schoolId: schoolIdParam,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation failed' };
  }
  const schoolId = parsed.data.schoolId ?? undefined;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_JOIN_CODE_RETRIES; attempt++) {
    try {
      const joinCode = generateJoinCode();
      const created = await dbCreateClass({
        name: parsed.data.name,
        level: parsed.data.level,
        timezone: parsed.data.timezone,
        description: parsed.data.description,
        joinCode,
        joinCodeEnabled: true,
        schoolId: schoolId ?? null,
      });
      redirect(`/dashboard/admin/classes/${created.id}`);
    } catch (err) {
      lastError = err as Error;
      const isUniqueViolation =
        err instanceof Error &&
        ('code' in err ? (err as { code?: string }).code === '23505' : false);
      if (!isUniqueViolation) throw err;
    }
  }
  return {
    error:
      lastError?.message ?? 'Could not generate unique join code. Please try again.',
  };
  } catch (err) {
    console.error('[createClassAction] Unexpected error:', err);
    throw err;
  }
}

/** Archive a class. Idempotent (already archived = success). Admin only. */
export async function archiveClassAction(classId: string) {
  await requirePermission('classes:write');
  const cls = await getClassById(classId);
  if (!cls) return { error: 'Class not found' };
  await dbUpdateClass(classId, { isArchived: true, archivedAt: new Date() });
  revalidatePath('/dashboard/admin/classes');
  revalidatePath(`/dashboard/admin/classes/${classId}`);
  revalidatePath('/dashboard/admin/schools');
  return { success: true };
}

const createSessionSchema = z.object({
  classId: z.string().uuid(),
  startsAt: z.string().transform((s) => new Date(s)),
  endsAt: z.string().transform((s) => new Date(s)),
  meetingUrl: z.string().optional(),
  title: z.string().optional(),
});

export async function createSessionAction(_prev: unknown, formData: FormData) {
  await requirePermission('sessions:write');
  const parsed = createSessionSchema.safeParse({
    classId: formData.get('classId'),
    startsAt: formData.get('startsAt'),
    endsAt: formData.get('endsAt'),
    meetingUrl: formData.get('meetingUrl') || undefined,
    title: formData.get('title') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation failed' };
  }
  const data = parsed.data;
  if (data.endsAt <= data.startsAt) {
    return { error: 'End time must be after start time' };
  }
  await dbCreateSession(data);
  redirect(`/dashboard/admin/classes/${data.classId}`);
}

const enrollStudentByEmailSchema = z.object({
  classId: z.string().uuid(),
  email: z.string().email(),
});

export async function enrollStudentByEmailAction(_prev: unknown, formData: FormData) {
  await requirePermission('enrollments:write');
  const parsed = enrollStudentByEmailSchema.safeParse({
    classId: formData.get('classId'),
    email: formData.get('email'),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation failed' };
  }
  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return { error: 'User not found with that email' };
  }
  if ((user.platformRole as PlatformRole) !== 'student') {
    return { error: 'User must have platform role student to enroll' };
  }
  const existing = await hasEnrollment(parsed.data.classId, user.id);
  if (existing) {
    return { error: 'Student is already enrolled in this class' };
  }
  await dbEnrollStudent({ classId: parsed.data.classId, studentUserId: user.id });
  redirect(`/dashboard/admin/classes/${parsed.data.classId}`);
}

const assignTeacherByEmailSchema = z.object({
  classId: z.string().uuid(),
  email: z.string().email(),
});

export async function assignTeacherByEmailAction(_prev: unknown, formData: FormData) {
  await requirePermission('classes:write');
  const parsed = assignTeacherByEmailSchema.safeParse({
    classId: formData.get('classId'),
    email: formData.get('email'),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation failed' };
  }
  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return { error: 'User not found with that email' };
  }
  if ((user.platformRole as PlatformRole) !== 'teacher') {
    return { error: 'User must have platform role teacher to be assigned' };
  }
  const existing = await hasTeacherAssignment(parsed.data.classId, user.id);
  if (existing) {
    return { error: 'Teacher is already assigned to this class' };
  }
  await dbAssignTeacher({
    classId: parsed.data.classId,
    teacherUserId: user.id,
  });
  redirect(`/dashboard/admin/classes/${parsed.data.classId}`);
}

const searchTeachersSchema = z.object({
  query: z.string().min(1, 'Enter at least 1 character').max(64),
});

export async function searchTeachersAction(query: string) {
  await requirePermission('classes:write');
  const parsed = searchTeachersSchema.safeParse({ query });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid query', teachers: [] as { id: number; name: string | null; email: string }[] };
  }
  const teachers = await searchTeachers(parsed.data.query, 10);
  return { teachers };
}

const assignTeacherToClassSchema = z.object({
  classId: z.string().uuid(),
  teacherUserId: z.number().int().positive(),
});

export async function assignTeacherToClassAction(
  _prev: unknown,
  formData: FormData
) {
  await requirePermission('classes:write');
  const parsed = assignTeacherToClassSchema.safeParse({
    classId: formData.get('classId'),
    teacherUserId: formData.get('teacherUserId')
      ? Number(formData.get('teacherUserId'))
      : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid request' };
  }
  const eduClass = await getClassById(parsed.data.classId);
  if (!eduClass) {
    return { error: 'Class not found' };
  }
  if (eduClass.isArchived) {
    return { error: 'Cannot assign teachers to an archived class' };
  }
  const teacherUser = await getUserById(parsed.data.teacherUserId);
  if (!teacherUser || (teacherUser.platformRole as PlatformRole) !== 'teacher') {
    return { error: 'Teacher not found or is not a teacher' };
  }
  const existing = await hasTeacherAssignment(parsed.data.classId, parsed.data.teacherUserId);
  if (existing) {
    return { error: 'Teacher is already assigned to this class' };
  }
  await dbAssignTeacher({
    classId: parsed.data.classId,
    teacherUserId: parsed.data.teacherUserId,
  });
  revalidatePath(`/dashboard/admin/classes/${parsed.data.classId}`);
  revalidatePath(`/dashboard/admin/users/teachers/${parsed.data.teacherUserId}`);
  redirect(`/dashboard/admin/classes/${parsed.data.classId}`);
}

const removeTeacherFromClassSchema = z.object({
  classId: z.string().uuid(),
  teacherUserId: z.number().int().positive(),
});

export async function removeTeacherFromClassAction(
  _prev: unknown,
  formData: FormData
) {
  await requirePermission('classes:write');
  const parsed = removeTeacherFromClassSchema.safeParse({
    classId: formData.get('classId'),
    teacherUserId: formData.get('teacherUserId')
      ? Number(formData.get('teacherUserId'))
      : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid request' };
  }
  const removed = await dbRemoveTeacherFromClass(
    parsed.data.classId,
    parsed.data.teacherUserId
  );
  if (!removed) {
    return { error: 'Assignment not found or already removed' };
  }
  revalidatePath(`/dashboard/admin/classes/${parsed.data.classId}`);
  revalidatePath(`/dashboard/admin/users/teachers/${parsed.data.teacherUserId}`);
  return { success: true };
}

const deactivateUserSchema = z.object({
  userId: z.number().int().positive(),
});

export async function deactivateUserAction(formData: FormData): Promise<{ error?: string }> {
  await requirePermission('users:write');
  const parsed = deactivateUserSchema.safeParse({
    userId: formData.get('userId') ? Number(formData.get('userId')) : undefined,
  });
  if (!parsed.success) return { error: 'Invalid request' };

  const user = await getUserById(parsed.data.userId);
  if (!user) return { error: 'User not found' };

  const ok = await deactivateUser(parsed.data.userId);
  if (!ok) return { error: 'Failed to deactivate user' };

  revalidatePath('/dashboard/admin/users');
  return {};
}

const archiveUserSchema = z.object({
  userId: z.number().int().positive(),
});

export async function archiveUserAction(formData: FormData): Promise<{ error?: string }> {
  await requirePermission('users:write');
  const parsed = archiveUserSchema.safeParse({
    userId: formData.get('userId') ? Number(formData.get('userId')) : undefined,
  });
  if (!parsed.success) return { error: 'Invalid request' };

  const user = await getUserById(parsed.data.userId);
  if (!user) return { error: 'User not found' };

  const ok = await archiveUser(parsed.data.userId);
  if (!ok) return { error: 'Failed to archive user' };

  revalidatePath('/dashboard/admin/users');
  return {};
}

export async function unarchiveUserAction(formData: FormData): Promise<{ error?: string }> {
  await requirePermission('users:write');
  const parsed = archiveUserSchema.safeParse({
    userId: formData.get('userId') ? Number(formData.get('userId')) : undefined,
  });
  if (!parsed.success) return { error: 'Invalid request' };

  const user = await getUserById(parsed.data.userId);
  if (!user) return { error: 'User not found' };

  const ok = await unarchiveUser(parsed.data.userId);
  if (!ok) return { error: 'Failed to unarchive user' };

  revalidatePath('/dashboard/admin/users');
  return {};
}

const updateEnrollmentSchema = z.object({
  classId: z.string().uuid(),
  studentUserId: z.number().int().positive(),
});

export async function pauseEnrollmentAction(formData: FormData): Promise<void> {
  await requirePermission('enrollments:write');
  const parsed = updateEnrollmentSchema.safeParse({
    classId: formData.get('classId'),
    studentUserId: formData.get('studentUserId') ? Number(formData.get('studentUserId')) : undefined,
  });
  if (!parsed.success) return;
  const eduClass = await getClassById(parsed.data.classId);
  if (!eduClass) return;
  const updated = await updateEnrollmentStatus(parsed.data.classId, parsed.data.studentUserId, 'paused');
  if (!updated) return;
  revalidatePath(`/classroom/${parsed.data.classId}/people`);
}

export async function unpauseEnrollmentAction(formData: FormData): Promise<void> {
  await requirePermission('enrollments:write');
  const parsed = updateEnrollmentSchema.safeParse({
    classId: formData.get('classId'),
    studentUserId: formData.get('studentUserId') ? Number(formData.get('studentUserId')) : undefined,
  });
  if (!parsed.success) return;
  const eduClass = await getClassById(parsed.data.classId);
  if (!eduClass) return;
  const updated = await updateEnrollmentStatus(parsed.data.classId, parsed.data.studentUserId, 'active');
  if (!updated) return;
  revalidatePath(`/classroom/${parsed.data.classId}/people`);
}

export async function removeEnrollmentAction(formData: FormData): Promise<void> {
  await requirePermission('enrollments:write');
  const parsed = updateEnrollmentSchema.safeParse({
    classId: formData.get('classId'),
    studentUserId: formData.get('studentUserId') ? Number(formData.get('studentUserId')) : undefined,
  });
  if (!parsed.success) return;
  const eduClass = await getClassById(parsed.data.classId);
  if (!eduClass) return;
  const updated = await updateEnrollmentStatus(parsed.data.classId, parsed.data.studentUserId, 'ended');
  if (!updated) return;
  revalidatePath(`/classroom/${parsed.data.classId}/people`);
}

const assignStudentToClassSchema = z.object({
  studentUserId: z.number().int().positive(),
  classId: z.string().uuid(),
});

export async function assignStudentToClassAction(
  formData: FormData
): Promise<{ error?: string }> {
  await requirePermission('classes:write');
  const parsed = assignStudentToClassSchema.safeParse({
    studentUserId: formData.get('studentUserId') ? Number(formData.get('studentUserId')) : undefined,
    classId: formData.get('classId'),
  });
  if (!parsed.success) return { error: 'Invalid request' };

  const user = await getUserById(parsed.data.studentUserId);
  if (!user) return { error: 'Student not found' };
  if ((user.platformRole as PlatformRole) !== 'student') {
    return { error: 'User must have platform role student' };
  }

  const eduClass = await getClassById(parsed.data.classId);
  if (!eduClass) return { error: 'Class not found' };

  const alreadyEnrolled = await hasActiveEnrollment(parsed.data.classId, parsed.data.studentUserId);
  if (alreadyEnrolled) return { error: 'Student is already enrolled in this class' };

  await endActiveEnrollmentsForStudent(parsed.data.studentUserId);
  await dbEnrollStudent({
    classId: parsed.data.classId,
    studentUserId: parsed.data.studentUserId,
  });

  revalidatePath('/dashboard/admin/users');
  revalidatePath(`/classroom/${parsed.data.classId}/people`);
  return {};
}

const joinClassByCodeSchema = z.object({
  code: z.string().min(1, 'Enter a class code'),
});

export async function joinClassByCodeAction(_prev: unknown, formData: FormData) {
  const user = await requirePermission('classes:read');
  if ((user.platformRole as PlatformRole) !== 'student') {
    await redirectWithLocale('/dashboard');
  }
  const parsed = joinClassByCodeSchema.safeParse({
    code: formData.get('code'),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid code' };
  }
  const eduClass = await getClassByJoinCode(parsed.data.code);
  if (!eduClass) {
    return { error: 'Invalid code. No class found with that code.' };
  }
  if (!eduClass.joinCodeEnabled) {
    return { error: 'This join code is disabled. Ask your teacher or admin for a new code.' };
  }
  const alreadyEnrolled = await hasEnrollment(eduClass.id, user.id);
  if (alreadyEnrolled) {
    return { error: 'You are already enrolled in this class.' };
  }
  await dbEnrollStudent({ classId: eduClass.id, studentUserId: user.id });
  await redirectWithLocale('/dashboard/student?joined=1');
  return {}; // unreachable; redirect throws
}

const toggleJoinCodeSchema = z.object({
  classId: z.string().uuid(),
  enabled: z.boolean(),
});

export async function toggleJoinCodeAction(_prev: unknown, formData: FormData) {
  await requirePermission('classes:write');
  const parsed = toggleJoinCodeSchema.safeParse({
    classId: formData.get('classId'),
    enabled: formData.get('enabled') === 'true',
  });
  if (!parsed.success) {
    return { error: 'Invalid request' };
  }
  await updateClassJoinCode(parsed.data.classId, {
    joinCodeEnabled: parsed.data.enabled,
  });
  redirect(`/dashboard/admin/classes/${parsed.data.classId}`);
}

const regenerateJoinCodeSchema = z.object({
  classId: z.string().uuid(),
});

export async function regenerateJoinCodeAction(_prev: unknown, formData: FormData) {
  await requirePermission('classes:write');
  const parsed = regenerateJoinCodeSchema.safeParse({
    classId: formData.get('classId'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request' };
  }
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const newCode = generateJoinCode();
      await updateClassJoinCode(parsed.data.classId, { joinCode: newCode });
      redirect(`/dashboard/admin/classes/${parsed.data.classId}`);
    } catch (err) {
      const isUniqueViolation =
        err instanceof Error &&
        'code' in err &&
        (err as { code?: string }).code === '23505';
      if (!isUniqueViolation || attempt === MAX_RETRIES - 1) throw err;
    }
  }
  return { error: 'Could not generate unique code. Try again.' };
}

const scheduleSchema = z.object({
  classId: z.string().uuid(),
  geckoLevel: z.enum(['G', 'E', 'C', 'K', 'O']).optional().nullable(),
  scheduleDays: z.string().optional(),
  scheduleStartTime: z.string().optional().nullable(),
  scheduleTimezone: z.string().optional().nullable(),
  scheduleStartDate: z.string().optional().nullable(),
  scheduleEndDate: z.string().optional().nullable(),
  defaultMeetingUrl: z.union([z.string().url(), z.literal('')]).optional().nullable(),
});

export async function updateClassScheduleAction(_prev: unknown, formData: FormData) {
  await requirePermission('classes:write');
  const parsed = scheduleSchema.safeParse({
    classId: formData.get('classId'),
    geckoLevel: formData.get('geckoLevel') || undefined,
    scheduleDays: formData.get('scheduleDays') || undefined,
    scheduleStartTime: formData.get('scheduleStartTime') || undefined,
    scheduleTimezone: formData.get('scheduleTimezone') || undefined,
    scheduleStartDate: formData.get('scheduleStartDate') || undefined,
    scheduleEndDate: formData.get('scheduleEndDate') || undefined,
    defaultMeetingUrl: formData.get('defaultMeetingUrl') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation failed' };
  }
  const classExists = await getClassById(parsed.data.classId);
  if (!classExists) return { error: 'Class not found' };
  let scheduleDays: string[] | null = null;
  if (parsed.data.scheduleDays) {
    try {
      scheduleDays = JSON.parse(parsed.data.scheduleDays) as string[];
    } catch {
      scheduleDays = [];
    }
  }
  const d = parsed.data;
  await dbUpdateClass(d.classId, {
    geckoLevel: d.geckoLevel ?? null,
    scheduleDays: scheduleDays ?? undefined,
    scheduleStartTime: d.scheduleStartTime?.trim() || null,
    scheduleTimezone: d.scheduleTimezone?.trim() || null,
    scheduleStartDate: d.scheduleStartDate?.trim() ? d.scheduleStartDate.trim().slice(0, 10) : null,
    scheduleEndDate: d.scheduleEndDate?.trim() ? d.scheduleEndDate.trim().slice(0, 10) : null,
    defaultMeetingUrl: d.defaultMeetingUrl === '' || !d.defaultMeetingUrl ? null : d.defaultMeetingUrl,
  });
  revalidatePath(`/dashboard/admin/classes/${parsed.data.classId}`);
  return {};
}

const exceptionSessionSchema = z.object({
  classId: z.string().uuid(),
  kind: z.enum(['extra', 'override', 'cancel']),
  startsAt: z.string().transform((s) => new Date(s)).optional(),
  endsAt: z.string().transform((s) => new Date(s)).optional(),
  originalStartsAt: z.string().transform((s) => new Date(s)).optional(),
  meetingUrl: z.string().url().optional().nullable().or(z.literal('')),
  title: z.string().optional().nullable(),
});

export async function createExceptionSessionAction(_prev: unknown, formData: FormData) {
  await requirePermission('sessions:write');
  const parsed = exceptionSessionSchema.safeParse({
    classId: formData.get('classId'),
    kind: formData.get('kind'),
    startsAt: formData.get('startsAt') || undefined,
    endsAt: formData.get('endsAt') || undefined,
    originalStartsAt: formData.get('originalStartsAt') || undefined,
    meetingUrl: formData.get('meetingUrl') || undefined,
    title: formData.get('title') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation failed' };
  }
  const data = parsed.data;
  if (data.kind === 'cancel') {
    if (!data.originalStartsAt) return { error: 'Original start time required for cancel' };
    await dbCreateSession({
      classId: data.classId,
      startsAt: data.originalStartsAt,
      endsAt: new Date(data.originalStartsAt.getTime() + 50 * 60 * 1000),
      kind: 'cancel',
      originalStartsAt: data.originalStartsAt,
    });
  } else if (data.kind === 'override') {
    if (!data.originalStartsAt || !data.startsAt || !data.endsAt) {
      return { error: 'Original and new start/end required for reschedule' };
    }
    await dbCreateSession({
      classId: data.classId,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      meetingUrl: data.meetingUrl || null,
      title: data.title ?? null,
      kind: 'override',
      originalStartsAt: data.originalStartsAt,
    });
  } else {
    if (!data.startsAt || !data.endsAt) return { error: 'Start and end required for extra session' };
    await dbCreateSession({
      classId: data.classId,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      meetingUrl: data.meetingUrl || null,
      title: data.title ?? null,
      kind: 'extra',
    });
  }
  revalidatePath(`/dashboard/admin/classes/${data.classId}`);
  redirect(`/dashboard/admin/classes/${data.classId}`);
}
