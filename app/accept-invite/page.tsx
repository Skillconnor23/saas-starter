import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import { cookies, headers } from 'next/headers';
import { getTranslations, getLocale } from 'next-intl/server';
import { validatePlatformInvite, consumePlatformInvite } from '@/lib/auth/invites';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, schoolMemberships } from '@/lib/db/schema';
import { enrollStudent } from '@/lib/db/queries/education';
import { auth } from '@/auth';
import { createAuditLog } from '@/lib/auth/audit';

const PLATFORM_INVITE_COOKIE = 'pending_platform_invite';
const PLATFORM_INVITE_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export const dynamic = 'force-dynamic';

const VALID_PLATFORM_ROLES = ['teacher', 'school_admin', 'student'] as const;

function getTranslatedInviteError(serverError: string, tAccept: (k: string) => string, tErrors: (k: string) => string): string {
  if (serverError === 'Invalid or missing invite link.') return tAccept('invalidOrMissing');
  if (serverError === 'Invalid or expired invite') return tErrors('invalidOrExpiredInvitation');
  return serverError;
}

/** Safe fallback when translations may fail during crash recovery. */
function getSafeTranslations(): { title: string; invalidOrMissing: string; tooManyRequests: string; backToSignIn: string; invalidOrExpired: string } {
  return {
    title: 'Invite invalid',
    invalidOrMissing: 'Invalid or missing invite link.',
    tooManyRequests: 'Too many requests. Please try again later.',
    backToSignIn: 'Back to sign in',
    invalidOrExpired: 'Invalid or expired invitation.',
  };
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  let tAccept: (k: string) => string;
  let tErrors: (k: string) => string;
  let signInHref = '/sign-in';
  try {
    const [ta, te, locale] = await Promise.all([
      getTranslations('auth.acceptInvite'),
      getTranslations('errors.auth'),
      getLocale().catch(() => 'en'),
    ]);
    tAccept = ta;
    tErrors = te;
    signInHref = locale && (locale === 'en' || locale === 'mn') ? `/${locale}/sign-in` : '/sign-in';
  } catch {
    const safe = getSafeTranslations();
    tAccept = (k: string) => (safe as Record<string, string>)[k] ?? safe.title;
    tErrors = () => safe.invalidOrExpired;
  }

  try {
    const params = await searchParams;
    const tokenRaw = params?.token;
    const token =
      typeof tokenRaw === 'string'
        ? tokenRaw.trim()
        : Array.isArray(tokenRaw) && tokenRaw.length > 0
          ? String(tokenRaw[0]).trim()
          : '';

    const hdrs = await headers();
    const ip = (await import('@/lib/auth/rate-limit')).getClientIp(hdrs);
    const { checkRateLimit } = await import('@/lib/auth/rate-limit');
    if (!checkRateLimit('accept-invite-ip', ip)) {
      return (
        <InviteError
          title={tAccept('invalidTitle')}
          message={tAccept('tooManyRequests')}
          backToSignIn={tAccept('backToSignIn')}
          signInHref={signInHref}
        />
      );
    }

    if (!token) {
      return (
        <InviteError
          title={tAccept('invalidTitle')}
          message={tAccept('invalidOrMissing')}
          backToSignIn={tAccept('backToSignIn')}
          signInHref={signInHref}
        />
      );
    }

    const result = await validatePlatformInvite(token);

    if (!result.ok) {
      return (
        <InviteError
          title={tAccept('invalidTitle')}
          message={getTranslatedInviteError(result.error, tAccept, tErrors)}
          backToSignIn={tAccept('backToSignIn')}
          signInHref={signInHref}
        />
      );
    }

    const { email, platformRole, schoolId, classId } = result;
    if (!VALID_PLATFORM_ROLES.includes(platformRole as (typeof VALID_PLATFORM_ROLES)[number])) {
      return (
        <InviteError
          title={tAccept('invalidTitle')}
          message={getTranslatedInviteError('Invalid or expired invite', tAccept, tErrors)}
          backToSignIn={tAccept('backToSignIn')}
          signInHref={signInHref}
        />
      );
    }
    if (platformRole === 'student' && !classId) {
      return (
        <InviteError
          title={tAccept('invalidTitle')}
          message={getTranslatedInviteError('Invalid or expired invite', tAccept, tErrors)}
          backToSignIn={tAccept('backToSignIn')}
          signInHref={signInHref}
        />
      );
    }

    const session = await auth();
    const currentUser = session?.user;

    if (currentUser?.id) {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(currentUser.id)))
        .limit(1);

      if (dbUser && dbUser.email && dbUser.email.toLowerCase() === email.toLowerCase()) {
        const consumed = await consumePlatformInvite(token.trim());
        if (!consumed.ok) {
          return (
            <InviteError
              title={tAccept('invalidTitle')}
              message={getTranslatedInviteError(consumed.error, tAccept, tErrors)}
              backToSignIn={tAccept('backToSignIn')}
              signInHref={signInHref}
            />
          );
        }
        try {
          await applyPlatformRole(dbUser.id, platformRole, schoolId ?? null, classId ?? null);
          await createAuditLog({
            action: 'invite_acceptance',
            userId: dbUser.id,
            metadata: { email, platformRole, schoolId, classId },
          });
        } catch (applyErr) {
          console.error('[accept-invite] applyPlatformRole failed:', applyErr);
          return (
            <InviteError
              title={tAccept('invalidTitle')}
              message={getTranslatedInviteError('Invalid or expired invite', tAccept, tErrors)}
              backToSignIn={tAccept('backToSignIn')}
              signInHref={signInHref}
            />
          );
        }
        await redirectWithLocale('/dashboard');
      }
    }

    const cookieStore = await cookies();
    cookieStore.set(PLATFORM_INVITE_COOKIE, token.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: PLATFORM_INVITE_COOKIE_MAX_AGE,
    });

    await redirectWithLocale(`/sign-up?email=${encodeURIComponent(email)}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('[accept-invite] Server render error:', err);
    const safe = getSafeTranslations();
    return (
      <InviteError
        title={safe.title}
        message={safe.invalidOrExpired}
        backToSignIn={safe.backToSignIn}
        signInHref={signInHref}
      />
    );
  }
}

async function applyPlatformRole(
  userId: number,
  platformRole: string,
  schoolId: string | null,
  classId: string | null
) {
  await db
    .update(users)
    .set({
      platformRole,
      schoolId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  if (platformRole === 'school_admin' && schoolId) {
    await db.insert(schoolMemberships).values({
      schoolId,
      userId,
      role: 'school_admin',
    }).onConflictDoNothing({
      target: [schoolMemberships.schoolId, schoolMemberships.userId],
    });
  }

  if (platformRole === 'student' && classId) {
    await enrollStudent({ classId, studentUserId: userId });
  }
}

function InviteError({
  title,
  message,
  backToSignIn,
  signInHref = '/sign-in',
}: {
  title: string;
  message: string;
  backToSignIn: string;
  signInHref?: string;
}) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
        <h1 className="text-xl font-semibold text-[#111827]">{title}</h1>
        <p className="mt-3 text-sm text-[#6b7280]">{message}</p>
        <a
          href={signInHref}
          className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
        >
          {backToSignIn}
        </a>
      </div>
    </div>
  );
}
