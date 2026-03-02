import 'server-only';
import { getUserById } from '@/lib/db/queries/education';
import { isStudentInTeacherClass } from '@/lib/db/queries/education';
import type { PlatformRole } from '@/lib/db/schema';

/**
 * Messaging permission: can sender message recipient?
 * Used by all messaging endpoints. Enforced server-side only.
 *
 * Rules:
 * - STUDENT → STUDENT: false
 * - SCHOOL_ADMIN → TEACHER: false
 * - SCHOOL_ADMIN → STUDENT: true only if same schoolId (both must have schoolId)
 * - ADMIN → anyone: true
 * - TEACHER ↔ STUDENT: true only if they share a class
 * - ADMIN ↔ SCHOOL_ADMIN: true
 * - SCHOOL_ADMIN → ADMIN: true
 * - Otherwise: false
 */
export async function canMessage(
  senderId: number,
  recipientId: number
): Promise<boolean> {
  if (senderId === recipientId) return false;

  const [sender, recipient] = await Promise.all([
    getUserById(senderId),
    getUserById(recipientId),
  ]);
  if (!sender || !recipient) return false;

  const senderRole = (sender.platformRole ?? '') as PlatformRole;
  const recipientRole = (recipient.platformRole ?? '') as PlatformRole;
  const senderSchoolId = sender.schoolId ?? null;
  const recipientSchoolId = recipient.schoolId ?? null;

  // STUDENT → STUDENT: false
  if (senderRole === 'student' && recipientRole === 'student') return false;

  // SCHOOL_ADMIN → TEACHER: false
  if (senderRole === 'school_admin' && recipientRole === 'teacher') return false;

  // ADMIN → anyone: true
  if (senderRole === 'admin') return true;

  // SCHOOL_ADMIN → STUDENT: true only if same school
  if (senderRole === 'school_admin' && recipientRole === 'student') {
    return !!(
      senderSchoolId &&
      recipientSchoolId &&
      senderSchoolId === recipientSchoolId
    );
  }

  // SCHOOL_ADMIN → ADMIN (admin → anyone already returned above)
  if (senderRole === 'school_admin' && recipientRole === 'admin') {
    return true;
  }

  // TEACHER → ADMIN (admin → anyone already returned above)
  if (senderRole === 'teacher' && recipientRole === 'admin') {
    return true;
  }

  // TEACHER ↔ STUDENT: only if they share a class
  if (
    (senderRole === 'teacher' && recipientRole === 'student') ||
    (senderRole === 'student' && recipientRole === 'teacher')
  ) {
    const teacherId = senderRole === 'teacher' ? senderId : recipientId;
    const studentId = senderRole === 'student' ? senderId : recipientId;
    return isStudentInTeacherClass(teacherId, studentId);
  }

  return false;
}
