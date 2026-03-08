'use server';

import { redirect } from 'next/navigation';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import { cookies } from 'next/headers';

const CLASS_INVITE_COOKIE_NAME = 'class_invite_token';
const CLASS_INVITE_COOKIE_MAX_AGE = 60 * 30; // 30 minutes

/** Set httpOnly cookie with invite token so post-auth flow can consume it. */
export async function setClassInviteCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CLASS_INVITE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CLASS_INVITE_COOKIE_MAX_AGE,
  });
}

/** Clear the invite cookie (e.g. after successful join or when invalid). */
export async function clearClassInviteCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CLASS_INVITE_COOKIE_NAME);
}

/** Get FormData from action args (form action may pass (formData) or (prevState, formData)). */
function getFormDataFromArgs(args: [unknown, unknown?]): FormData | null {
  const a = args[0];
  const b = args[1];
  if (a instanceof FormData) return a;
  if (b instanceof FormData) return b;
  return null;
}

/**
 * Set invite cookie then redirect to sign-up. Use as form action for "Sign up" on join page.
 */
export async function setClassInviteCookieAndRedirectToSignUp(
  ...args: [unknown, unknown?]
): Promise<never> {
  const formData = getFormDataFromArgs(args);
  if (!formData) await redirectWithLocale('/sign-in');
  const token = formData!.get('token');
  const path = formData!.get('redirectPath');
  if (typeof token !== 'string' || !token.trim() || typeof path !== 'string' || !path.trim()) {
    await redirectWithLocale('/sign-in');
  }
  await setClassInviteCookie((token as string).trim());
  redirect(path as string);
}

/**
 * Set invite cookie then redirect to sign-in. Use as form action for "Log in" on join page.
 */
export async function setClassInviteCookieAndRedirectToSignIn(
  ...args: [unknown, unknown?]
): Promise<never> {
  const formData = getFormDataFromArgs(args);
  if (!formData) await redirectWithLocale('/sign-in');
  const token = formData!.get('token');
  const path = formData!.get('redirectPath');
  if (typeof token !== 'string' || !token.trim() || typeof path !== 'string' || !path.trim()) {
    await redirectWithLocale('/sign-in');
  }
  await setClassInviteCookie((token as string).trim());
  redirect(path as string);
}
import { requirePermission, can } from '@/lib/auth/permissions';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { getCurrentUserOrNull } from '@/lib/auth/user';
import type { PlatformRole } from '@/lib/db/schema';
import {
  getInviteByToken,
  isInviteValid,
  getActiveInviteForClass,
  createClassInvite,
  regenerateClassInvite,
  incrementInviteUses,
} from '@/lib/db/queries/class-invites';
import {
  hasActiveEnrollment,
  hasTeacherAssignment,
  enrollStudent,
  getClassById,
} from '@/lib/db/queries/education';

/** Admin/school_admin or teacher assigned to this class can manage invite links. */
async function requireCanManageClassInvite(classId: string): Promise<NonNullable<Awaited<ReturnType<typeof requirePermission>>>> {
  const user = await requirePermission('classes:read');
  if (can(user, 'classes:write')) return user;
  if ((user.platformRole as PlatformRole) === 'teacher' && await hasTeacherAssignment(classId, user.id)) return user;
  await redirectWithLocale('/dashboard');
  return user; // unreachable; redirect throws
}

/** Get invite by token (for public join page). Returns null if invalid. */
export async function getInviteByTokenAction(token: string) {
  const inv = await getInviteByToken(token);
  if (!inv || !isInviteValid(inv)) return null;
  return {
    classId: inv.classId,
    className: inv.className ?? undefined,
    token: inv.token,
  };
}

export type JoinClassWithInviteResult =
  | { success: true; classId: string }
  | { success: false; error: string };

/**
 * Server action for form: join with token, redirect to student dashboard on success.
 */
export async function joinClassWithInviteFormAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const token = formData.get('token');
  if (typeof token !== 'string' || !token.trim()) {
    return { error: 'Invalid invite' };
  }
  const result = await joinClassWithInviteAction(token.trim());
  if (result.success) {
    const { getLocale } = await import('next-intl/server');
    const locale = (await getLocale()) || 'en';
    redirect(`/${locale}/dashboard/student`);
  }
  return { error: result.error };
}

/**
 * Join the current user to a class using an invite token.
 * User must have platformRole = student. Idempotent if already enrolled.
 */
export async function joinClassWithInviteAction(
  token: string
): Promise<JoinClassWithInviteResult> {
  const user = await getCurrentUserOrNull();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!checkRateLimit('join-class-invite', String(user.id))) {
    return { success: false, error: 'Too many attempts. Please try again later.' };
  }

  const role = user.platformRole as PlatformRole | null;
  if (role !== 'student') {
    return { success: false, error: 'Only students can join a class via invite link' };
  }

  const inv = await getInviteByToken(token);
  if (!inv || !isInviteValid(inv)) {
    return { success: false, error: 'Invalid or expired invite' };
  }

  const alreadyEnrolled = await hasActiveEnrollment(inv.classId, user.id);
  if (alreadyEnrolled) {
    return { success: true, classId: inv.classId };
  }

  try {
    await enrollStudent({ classId: inv.classId, studentUserId: user.id });
  } catch (err) {
    const isUniqueViolation =
      err instanceof Error && 'code' in err && (err as { code?: string }).code === '23505';
    if (isUniqueViolation) {
      return { success: true, classId: inv.classId };
    }
    throw err;
  }

  await incrementInviteUses(token);
  return { success: true, classId: inv.classId };
}

/** Get active invite for class (for teacher/admin UI). */
export async function getActiveInviteForClassAction(classId: string) {
  await requireCanManageClassInvite(classId);
  const invite = await getActiveInviteForClass(classId);
  if (!invite) return null;
  const eduClass = await getClassById(classId);
  return {
    token: invite.token,
    className: eduClass?.name ?? null,
    usesCount: invite.usesCount,
  };
}

/** Create or get active invite link for a class. Only admin/teacher. */
export async function createOrGetClassInviteAction(classId: string) {
  const user = await requireCanManageClassInvite(classId);
  if (!checkRateLimit('create-class-invite', String(user.id))) {
    await redirectWithLocale('/dashboard');
  }
  const existing = await getActiveInviteForClass(classId);
  if (existing) {
    return { token: existing.token };
  }
  const created = await createClassInvite(classId, user.id);
  return { token: created.token };
}

/** Form action for "Generate invite link" button. */
export async function createOrGetClassInviteFormAction(
  _prev: { token: string | null; error: string | null },
  formData: FormData
): Promise<{ token: string | null; error: string | null }> {
  const classId = formData.get('classId');
  if (typeof classId !== 'string' || !classId.trim()) {
    return { token: null, error: 'Invalid request' };
  }
  try {
    const result = await createOrGetClassInviteAction(classId.trim());
    return { token: result?.token ?? null, error: null };
  } catch {
    return { token: null, error: 'Failed to generate link' };
  }
}

/** Regenerate invite link (creates new token, deactivates old). */
export async function regenerateClassInviteAction(classId: string) {
  const user = await requireCanManageClassInvite(classId);
  if (!checkRateLimit('create-class-invite', String(user.id))) {
    await redirectWithLocale('/dashboard');
  }
  await regenerateClassInvite(classId, user.id);
  await redirectWithLocale(`/dashboard/admin/classes/${classId}`);
}

/** Form action for regenerate button. */
export async function regenerateClassInviteFormAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const classId = formData.get('classId');
  if (typeof classId !== 'string' || !classId.trim()) return { error: 'Invalid request' };
  await regenerateClassInviteAction(classId.trim());
  return { error: null };
}

/**
 * If the request has a class_invite_token cookie and the user is a student,
 * join them to the class, clear the cookie, and redirect to /dashboard/student.
 * Call this after sign-in/sign-up with the newly authenticated user.
 */
export async function consumeClassInviteCookieAndRedirect(
  userId: number,
  platformRole: PlatformRole | null,
  locale?: string
): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLASS_INVITE_COOKIE_NAME)?.value;
  if (!token?.trim()) return;
  if (platformRole !== 'student') return;

  const inv = await getInviteByToken(token.trim());
  if (!inv || !isInviteValid(inv)) {
    await clearClassInviteCookie();
    return;
  }

  const alreadyEnrolled = await hasActiveEnrollment(inv.classId, userId);
  if (!alreadyEnrolled) {
    try {
      await enrollStudent({ classId: inv.classId, studentUserId: userId });
      await incrementInviteUses(token.trim());
    } catch {
      // e.g. duplicate — treat as joined
    }
  }
  await clearClassInviteCookie();
  const prefix = locale && /^(en|mn)$/.test(locale) ? `/${locale}` : '';
  redirect(`${prefix}/dashboard/student`);
}
