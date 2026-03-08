/**
 * Platform role security helpers.
 * Self-service signups must be STUDENT only. Elevated roles are invitation-only.
 */

import type { PlatformRole } from '@/lib/db/schema';

/** The only role allowed for self-service signup/onboarding. */
export const SELF_SERVE_PLATFORM_ROLE: PlatformRole = 'student';

/** Elevated roles that require invitation or explicit admin assignment. */
const ELEVATED_ROLES: readonly PlatformRole[] = [
  'admin',
  'teacher',
  'school_admin',
] as const;

/** Whether the role is elevated (not self-servable). */
export function isElevatedPlatformRole(role: string | null): role is 'admin' | 'teacher' | 'school_admin' {
  return role !== null && (ELEVATED_ROLES as readonly string[]).includes(role);
}

/** Returns the allowed role for self-service flows. Client input must never be trusted. */
export function getAllowedSelfServeRole(): PlatformRole {
  return SELF_SERVE_PLATFORM_ROLE;
}
