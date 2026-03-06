import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { createAuditLog } from '@/lib/auth/audit';
import type { PlatformRole } from '@/lib/db/schema';

export type Permission =
  | 'classes:read'
  | 'classes:write'
  | 'sessions:read'
  | 'sessions:write'
  | 'enrollments:read'
  | 'enrollments:write'
  | 'users:read'
  | 'users:write'
  | 'invites:create';

const ALL_PERMISSIONS: Permission[] = [
  'classes:read',
  'classes:write',
  'invites:create',
  'sessions:read',
  'sessions:write',
  'enrollments:read',
  'enrollments:write',
  'users:read',
  'users:write',
];

const roleToPermissions: Record<PlatformRole, Permission[]> = {
  admin: ALL_PERMISSIONS,
  school_admin: [
    'classes:read',
    'classes:write',
    'invites:create',
    'sessions:read',
    'sessions:write',
    'enrollments:read',
    'enrollments:write',
    'users:read',
    // users:write excluded
  ],
  teacher: [
    'classes:read',
    'sessions:read',
    'sessions:write',
    'enrollments:read',
  ],
  student: ['classes:read', 'sessions:read'],
};

/**
 * Returns whether the user has the given permission.
 */
export function can(
  user: { platformRole: string | null } | null,
  permission: Permission
): boolean {
  if (!user?.platformRole) return false;
  const role = user.platformRole as PlatformRole;
  const permissions = roleToPermissions[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Requires one or more permissions. Redirects to /dashboard if not allowed.
 * Returns the user (caller must have already verified auth).
 */
export async function requirePermission(
  permissionOrPermissions: Permission | Permission[]
): Promise<NonNullable<Awaited<ReturnType<typeof getUser>>>> {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }
  const permissions = Array.isArray(permissionOrPermissions)
    ? permissionOrPermissions
    : [permissionOrPermissions];
  const allowed = permissions.some((p) => can(user, p));
  if (!allowed) {
    createAuditLog({
      action: 'failed_privileged_access',
      userId: user.id,
      metadata: { required: permissions, hadRole: user.platformRole },
    }).catch(() => {});
    redirect('/dashboard');
  }
  return user;
}
