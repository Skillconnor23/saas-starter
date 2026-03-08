/**
 * Connor-only account switching: after login as connor@geckoteach.com,
 * he can choose "Continue as Admin" or "Continue as Teacher".
 * When "Teacher" is chosen, we set a cookie so getUser() returns the teacher user.
 */

import { cookies } from 'next/headers';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

export const CONNOR_ADMIN_EMAIL = 'connor@geckoteach.com';

/** Cookie storing the user id Connor is impersonating (teacher test account). */
export const IMPERSONATE_USER_ID_COOKIE = 'impersonate_user_id';

/** Teacher test account Connor switches into via "Continue as Teacher". */
export const CONNOR_TEACHER_EMAIL = 'connor+teacher@geckoteach.com';

/** Env override for teacher test account. */
const TEACHER_TEST_EMAIL_ENV = 'CONNOR_TEACHER_TEST_EMAIL';

function getTeacherTestEmail(): string {
  const env = process.env[TEACHER_TEST_EMAIL_ENV];
  return (env?.trim() || CONNOR_TEACHER_EMAIL).toLowerCase();
}

/**
 * Returns the impersonated user id from cookie, or null.
 * Only meaningful when the session user is connor@geckoteach.com.
 */
export async function getImpersonateUserIdFromCookie(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get(IMPERSONATE_USER_ID_COOKIE)?.value;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
}

/**
 * Looks up the teacher test user by email (CONNOR_TEACHER_TEST_EMAIL or connor+teacher@geckoteach.com).
 * Query: email = connor+teacher@geckoteach.com AND platformRole = 'teacher' AND deletedAt IS NULL.
 * Returns the user id if found, else null.
 */
export async function getConnorTeacherUserId(): Promise<number | null> {
  const email = getTeacherTestEmail();

  const [row] = await db
    .select({ id: users.id, platformRole: users.platformRole })
    .from(users)
    .where(
      and(
        sql`lower(${users.email}) = lower(${email})`,
        eq(users.platformRole, 'teacher'),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  return row?.id ?? null;
}

/**
 * Sets the impersonate cookie to the teacher test user. Call only when session is Connor.
 */
export async function setImpersonateTeacherCookie(): Promise<
  { ok: true; redirectTo: string } | { ok: false; error: string }
> {
  const userId = await getConnorTeacherUserId();

  if (!userId) {
    return {
      ok: false,
      error: 'Unable to switch to teacher account.',
    };
  }

  const store = await cookies();
  store.set(IMPERSONATE_USER_ID_COOKIE, String(userId), {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return { ok: true, redirectTo: '/dashboard/teacher' };
}

/**
 * Returns true when the session user is Connor and the impersonate cookie is set.
 */
export async function isImpersonating(): Promise<boolean> {
  const { auth } = await import('@/auth');
  const session = await auth();
  const email = (session?.user as { email?: string } | undefined)?.email?.trim().toLowerCase();
  if (email !== CONNOR_ADMIN_EMAIL) return false;
  const impersonateId = await getImpersonateUserIdFromCookie();
  return impersonateId != null;
}

/**
 * Clears the impersonate cookie. Use when Connor switches back to Admin.
 */
export async function clearImpersonateCookie(): Promise<void> {
  const store = await cookies();
  store.delete(IMPERSONATE_USER_ID_COOKIE);
}
