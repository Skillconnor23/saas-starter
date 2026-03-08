import { getUser } from '@/lib/db/queries';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import {
  teacherAssignedToClass,
  studentEnrolledInClass,
  getClassById,
} from '@/lib/db/queries/education';
import { getSchoolIdsForUser } from '@/lib/db/queries/schools';
import { can as canPermission } from '@/lib/auth/permissions';
import type { PlatformRole } from '@/lib/db/schema';

export type UserWithId = { id: number; platformRole: string | null };

type ClassWithSchool = { id: string; schoolId: string | null };

/**
 * Returns whether the user can view this classroom (teacher assigned, student enrolled, or admin/school_admin with school scope).
 */
export async function canAccessClassroom(
  user: UserWithId | null,
  classId: string,
  eduClass?: ClassWithSchool | null
): Promise<boolean> {
  if (!user) return false;
  const role = user.platformRole as PlatformRole | null;
  if (!role) return false;

  if (role === 'admin') {
    return canPermission(user, 'classes:read');
  }
  if (role === 'school_admin') {
    if (!canPermission(user, 'classes:read')) return false;
    if (!eduClass?.schoolId) return false;
    const schoolIds = await getSchoolIdsForUser(user.id);
    return schoolIds.includes(eduClass.schoolId);
  }
  if (role === 'teacher') {
    return teacherAssignedToClass(user.id, classId);
  }
  if (role === 'student') {
    return studentEnrolledInClass(user.id, classId);
  }
  return false;
}

/**
 * Returns whether the user can create posts in this classroom (teacher assigned or admin/school_admin with school scope).
 */
export async function canPostToClassroom(
  user: UserWithId | null,
  classId: string,
  eduClass?: ClassWithSchool | null
): Promise<boolean> {
  if (!user) return false;
  const role = user.platformRole as PlatformRole | null;
  if (!role) return false;

  if (role === 'admin') {
    return canPermission(user, 'classes:write');
  }
  if (role === 'school_admin') {
    if (!canPermission(user, 'classes:write')) return false;
    if (!eduClass?.schoolId) return false;
    const schoolIds = await getSchoolIdsForUser(user.id);
    return schoolIds.includes(eduClass.schoolId);
  }
  if (role === 'teacher') {
    return teacherAssignedToClass(user.id, classId);
  }
  return false;
}

/**
 * Ensures user is logged in and can access the classroom. Redirects to /dashboard if not.
 */
export async function requireClassroomAccess(classId: string) {
  const user = await getUser();
  if (!user) {
    await redirectWithLocale('/sign-in');
  }
  const eduClass = await getClassById(classId);
  if (!eduClass) {
    await redirectWithLocale('/dashboard');
  }
  const allowed = await canAccessClassroom(user, classId, eduClass);
  if (!allowed) {
    await redirectWithLocale('/dashboard');
  }
  return { user: user as NonNullable<typeof user>, eduClass: eduClass as NonNullable<typeof eduClass> };
}
