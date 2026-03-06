import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { createAuditLog } from '@/lib/auth/audit';
import type { PlatformRole } from '@/lib/db/schema';

export type CurrentUser = Awaited<ReturnType<typeof getUser>>;

/**
 * Returns the logged-in user including platformRole, or null if not authenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return getUser();
}

/**
 * Returns the current user if authenticated, otherwise null.
 * Does not throw, redirect, or require auth. Use for public or optional-auth flows
 * (e.g. join invite page where both logged-in and logged-out users can land).
 */
export async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
  try {
    return await getUser();
  } catch {
    return null;
  }
}

/**
 * Requires the user to be logged in. Redirects to /sign-in if not.
 * Returns the user.
 */
export async function requireAuth(): Promise<NonNullable<CurrentUser>> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }
  return user;
}

/**
 * Requires the user to be logged in and have a platform role.
 * Redirects to /sign-in if not authenticated, or /dashboard/student if no platform role (default).
 * Returns the user with platformRole.
 */
export async function requirePlatformRole(): Promise<
  NonNullable<CurrentUser> & { platformRole: PlatformRole }
> {
  const user = await requireAuth();
  if (!user.platformRole) {
    redirect('/dashboard/student');
  }
  return user as NonNullable<CurrentUser> & { platformRole: PlatformRole };
}

/**
 * Requires the user to have one of the given platform roles.
 * Redirects to /sign-in if not authenticated.
 * Redirects to /dashboard/student if user has no platform role.
 * Redirects to /dashboard if user does not have an allowed role.
 */
export async function requireRole(
  allowedRoles: PlatformRole[]
): Promise<NonNullable<CurrentUser> & { platformRole: PlatformRole }> {
  const user = await requirePlatformRole();
  if (!allowedRoles.includes(user.platformRole as PlatformRole)) {
    createAuditLog({
      action: 'failed_privileged_access',
      userId: user.id,
      metadata: { requiredRoles: allowedRoles, hadRole: user.platformRole },
    }).catch(() => {});
    redirect('/dashboard');
  }
  return user;
}
