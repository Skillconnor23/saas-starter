'use server';

import { z } from 'zod';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
  invitations,
} from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { signIn as authSignIn, signOut as authSignOut } from '@/auth';
import { AuthError } from 'next-auth';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser, getUserWithTeam, getTeamForUser, getTeamForUserId } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';
import { consumeClassInviteCookieAndRedirect } from '@/lib/actions/class-invite';
import {
  createVerificationToken,
  sendVerificationEmailIfNeeded,
} from '@/lib/auth/verification';
import { sendVerificationEmail } from '@/lib/auth/email';
import { createAuditLog } from '@/lib/auth/audit';
import { consumePlatformInvite } from '@/lib/auth/invites';
import { schoolMemberships } from '@/lib/db/schema';
import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || '',
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

const isSignInDebug =
  process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true';

/** Always-on trace: logs every invalidCredentials return path for production debugging. */
function traceReturnInvalidCredentials(path: string, extra?: Record<string, unknown>) {
  console.log('[signin-trace] RETURN invalidCredentials | path:', path, extra ? '|', JSON.stringify(extra) : '');
}

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  if (isSignInDebug) {
    console.log('[signin] Before authSignIn | email:', email);
  }

  let result: { ok?: boolean; error?: string; url?: string | null } | undefined;
  try {
    result = await authSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    // Always-on: exact authSignIn return value
    console.log('[signin-trace] authSignIn returned |', JSON.stringify({ ok: result?.ok, error: result?.error, url: result?.url }));

    if (isSignInDebug) {
      console.log(
        '[signin] After authSignIn (returned) | ok:',
        result?.ok,
        '| error:',
        result?.error,
        '| url:',
        result?.url
      );
    }

    if (result?.error) {
      const errStr = typeof result.error === 'string' ? result.error : String(result.error);
      if (
        errStr.toLowerCase().includes('verify') ||
        errStr.includes('email_not_verified') ||
        errStr.includes('EmailNotVerified')
      ) {
        await sendVerificationEmailIfNeeded(email);
        return {
          error: 'emailNotVerified',
          email,
          password,
        };
      }
      traceReturnInvalidCredentials('result.error (not verify)', { error: result.error });
      return {
        error: 'invalidCredentials',
        email,
        password,
      };
    }

    if (!result?.ok) {
      traceReturnInvalidCredentials('!result.ok', { ok: result?.ok });
      return {
        error: 'invalidCredentials',
        email,
        password,
      };
    }
  } catch (error) {
    if (isSignInDebug) {
      console.log(
        '[signin] Caught error | isRedirectError:',
        isRedirectError(error),
        '| AuthError:',
        error instanceof AuthError,
        '| message:',
        error instanceof Error ? error.message : String(error)
      );
    }
    // Next.js redirect() throws NEXT_REDIRECT; re-throw so redirect executes, don't treat as invalid credentials
    if (isRedirectError(error)) {
      console.log('[signin-trace] Re-throwing redirect error');
      throw error;
    }
    if (error instanceof AuthError) {
      const authErr = error as AuthError & { code?: string };
      if (authErr.code === 'email_not_verified') {
        await sendVerificationEmailIfNeeded(email);
        return {
          error: 'emailNotVerified',
          email,
          password,
        };
      }
    }
    traceReturnInvalidCredentials('catch (not redirect, not email_not_verified)', {
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      error: 'invalidCredentials',
      email,
      password,
    };
  }

  // IMPORTANT: auth()/getUser() returns null in the SAME request after signIn(redirect:false)
  // because the session cookie is set in the response, not yet in the request. Fetch user by
  // email instead — we know credentials were valid, so the user exists.
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        sql`lower(${users.email}) = lower(${email})`,
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  if (!user) {
    traceReturnInvalidCredentials('user lookup by email returned null');
    return { error: 'invalidCredentials', email, password };
  }

  if (isSignInDebug) {
    console.log('[signin] User found by email | id:', user.id, '| proceeding to redirect');
  }
  console.log('[signin-trace] User loaded by email | id:', user.id);

  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_IN);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    const team = await getTeamForUserId(user.id);
    return createCheckoutSession({ team, priceId, userId: user.id });
  }

  await consumeClassInviteCookieAndRedirect(
    user.id,
    user.platformRole as 'student' | 'teacher' | 'admin' | 'school_admin' | null
  );
  const safeNext =
    redirectTo &&
    typeof redirectTo === 'string' &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//')
      ? redirectTo
      : '/dashboard';

  console.log('[signin-trace] Success — redirecting to:', safeNext);
  redirect(safeNext);
});

/** Resend verification email for unverified users. Respects cooldown to avoid spam. */
export async function resendVerificationEmail(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const raw = formData.get('email');
  if (typeof raw !== 'string' || !raw.trim()) {
    return { error: 'Email is required' };
  }
  const email = raw.trim();

  const { checkRateLimit } = await import('@/lib/auth/rate-limit');
  if (!checkRateLimit('resend-verification', email)) {
    return { success: true }; // Don't reveal rate limit
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, emailVerified: users.emailVerified })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);

  if (!user) {
    return { success: true }; // Don't reveal whether user exists
  }

  if (user.emailVerified) {
    return { success: true }; // Already verified
  }

  const sendEmail = user.email;
  const sendResult = await sendVerificationEmailIfNeeded(sendEmail);
  if (!sendResult.sent) {
    console.error('[resend-verification] Failed to send:', sendResult.error, '| user:', user.id, '| email:', sendEmail);
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('[resend-verification] Sent to:', sendEmail);
  }
  return { success: true };
}

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

const isAuthDebug = process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true';

export const signUp = validatedAction(signUpSchema, async (data) => {
  const { email, password, inviteId } = data;
  const emailNormalized = email.trim().toLowerCase();

  // Case-insensitive duplicate check (auth uses same lookup)
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'createUserFailed',
      email,
      password,
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email: emailNormalized,
    passwordHash,
    role: 'owner',
    platformRole: 'student', // Public signup is student-only
    emailVerified: null, // Must verify before access
  };

  let createdUser!: typeof users.$inferSelect;
  let teamId!: number;
  let userRole!: string;

  try {
  await db.transaction(async (tx) => {
    // 1. Create user first — auth and all other flows depend on users table
    const [user] = await tx.insert(users).values(newUser).returning();
    if (!user) {
      throw new Error('User insert failed');
    }
    createdUser = user;

    if (isAuthDebug) {
      console.log('[signup] User row created: id=', createdUser.id, 'email=', createdUser.email);
    }

    if (inviteId) {
      const [invitation] = await tx
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.id, parseInt(inviteId)),
            sql`lower(${invitations.email}) = lower(${email})`,
            eq(invitations.status, 'pending')
          )
        )
        .limit(1);

      if (!invitation) {
        throw new Error('invalidOrExpiredInvitation');
      }

      teamId = invitation.teamId;
      userRole = invitation.role;

      await tx
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id));

      await tx.insert(activityLogs).values({
        teamId,
        userId: createdUser.id,
        action: ActivityType.ACCEPT_INVITATION,
      });

      if (isAuthDebug) {
        console.log('[signup] Joined existing team: teamId=', teamId);
      }
    } else {
      const newTeam: NewTeam = {
        name: `${emailNormalized}'s Team`,
      };

      const [team] = await tx.insert(teams).values(newTeam).returning();
      if (!team) {
        throw new Error('Team insert failed');
      }
      teamId = team.id;
      userRole = 'owner';

      await tx.insert(activityLogs).values({
        teamId,
        userId: createdUser.id,
        action: ActivityType.CREATE_TEAM,
      });

      if (isAuthDebug) {
        console.log('[signup] Team row created: teamId=', teamId);
      }
    }

    // 3. Team membership — links user to team
    await tx.insert(teamMembers).values({
      userId: createdUser.id,
      teamId,
      role: userRole,
    });

    if (isAuthDebug) {
      console.log('[signup] Team membership created: userId=', createdUser.id, 'teamId=', teamId);
    }
  });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'invalidOrExpiredInvitation') {
      return { error: 'invalidOrExpiredInvitation', email, password };
    }
    console.error('[signup] Transaction failed:', err);
    return { error: 'createUserFailed', email, password };
  }

  if (isAuthDebug) {
    console.log('[signup] Provisioning complete. User id=', createdUser.id, '| teamId=', teamId);
  }

  const cookieStore = await cookies();
  const platformInviteToken = cookieStore.get('pending_platform_invite')?.value;
  if (platformInviteToken) {
    const consumed = await consumePlatformInvite(platformInviteToken);
    if (
      consumed.ok &&
      consumed.email.toLowerCase() === email.toLowerCase()
    ) {
      await db
        .update(users)
        .set({
          platformRole: consumed.platformRole,
          schoolId: consumed.schoolId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, createdUser.id));
      if (
        consumed.platformRole === 'school_admin' &&
        consumed.schoolId
      ) {
        await db
          .insert(schoolMemberships)
          .values({
            schoolId: consumed.schoolId,
            userId: createdUser.id,
            role: 'school_admin',
          })
          .onConflictDoNothing({
            target: [schoolMemberships.schoolId, schoolMemberships.userId],
          });
      }
      await createAuditLog({
        action: 'invite_acceptance',
        userId: createdUser.id,
        metadata: {
          email,
          platformRole: consumed.platformRole,
          schoolId: consumed.schoolId,
        },
      });
      cookieStore.delete('pending_platform_invite');
    }
  }

  const token = await createVerificationToken(emailNormalized);
  const sendResult = await sendVerificationEmail(emailNormalized, token);
  if (!sendResult.ok) {
    console.error('[signup] Verification email failed:', sendResult.error, '| email:', email);
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('[signup] Verification email sent to:', email);
  }

  await createAuditLog({
    action: 'signup',
    userId: createdUser.id,
    metadata: { email },
  });

  await logActivity(teamId, createdUser.id, ActivityType.SIGN_UP);

  // Do NOT sign in - user must verify email first
  const locale = await getLocale();
  redirect(`/${locale}/check-email`);
});

export async function signOut() {
  const user = (await getUser()) as User | null;
  if (user) {
    const userWithTeam = await getUserWithTeam(user.id);
    await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
  }
  await authSignOut({ redirectTo: '/sign-in' });
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;
    const { comparePasswords } = await import('@/lib/auth/session');

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.',
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.',
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD),
    ]);

    return {
      success: 'Password updated successfully.',
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;
    const { comparePasswords } = await import('@/lib/auth/session');

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.',
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId ?? undefined,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`,
      })
      .where(eq(users.id, user.id));

    if (userWithTeam?.teamId) {
      await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, user.id),
            eq(teamMembers.teamId, userWithTeam.teamId)
          )
        );
    }

    await authSignOut({ redirectTo: '/sign-in' });
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId ?? undefined, user.id, ActivityType.UPDATE_ACCOUNT),
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.number(),
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.teamId, userWithTeam.teamId)
        )
      );

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER
    );

    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner']),
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(
        and(
          eq(users.email, email),
          eq(teamMembers.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'User is already a member of this team' };
    }

    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.teamId, userWithTeam.teamId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email' };
    }

    await db.insert(invitations).values({
      teamId: userWithTeam.teamId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending',
    });

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER
    );

    return { success: 'Invitation sent successfully' };
  }
);
