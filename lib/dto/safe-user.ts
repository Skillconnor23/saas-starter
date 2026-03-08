/**
 * Safe user DTO for API responses. Never expose passwordHash or internal DB fields.
 */

export type SafeUserDto = {
  id: number;
  name: string | null;
  email: string;
  platformRole: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  schoolId: string | null;
};

/**
 * Maps a raw DB user row to a safe DTO. Strips passwordHash and internal fields.
 */
export function toSafeUserDto(
  user: {
    id: number;
    name: string | null;
    email: string;
    platformRole: string | null;
    avatarUrl: string | null;
    timezone: string | null;
    schoolId: string | null;
  } | null
): SafeUserDto | null {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    platformRole: user.platformRole,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    schoolId: user.schoolId,
  };
}
