import type { PlatformRole } from '@/lib/db/schema';

export function getRoleDashboardPath(platformRole: PlatformRole | null): string {
  if (!platformRole) return '/dashboard/student';
  switch (platformRole) {
    case 'student':
      return '/dashboard/student';
    case 'admin':
      return '/dashboard/admin';
    case 'teacher':
      return '/dashboard/teacher';
    case 'school_admin':
      return '/dashboard/school-admin';
    default:
      return '/dashboard/student';
  }
}
