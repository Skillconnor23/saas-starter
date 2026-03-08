import { redirect } from 'next/navigation';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { validatePlatformInvite, consumePlatformInvite } from '@/lib/auth/invites';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, schoolMemberships } from '@/lib/db/schema';
import { auth } from '@/auth';
import { createAuditLog } from '@/lib/auth/audit';

const PLATFORM_INVITE_COOKIE = 'pending_platform_invite';
const PLATFORM_INVITE_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export const dynamic = 'force-dynamic';

function getTranslatedInviteError(serverError: string, tAccept: (k: string) => string, tErrors: (k: string) => string): string {
  if (serverError === 'Invalid or missing invite link.') return tAccept('invalidOrMissing');
  if (serverError === 'Invalid or expired invite') return tErrors('invalidOrExpiredInvitation');
  return serverError;
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const tAccept = await getTranslations('auth.acceptInvite');
  const tErrors = await getTranslations('errors.auth');
  const params = await searchParams;
  const token = params.token;

  const hdrs = await headers();
  const ip = (await import('@/lib/auth/rate-limit')).getClientIp(hdrs);
  const { checkRateLimit } = await import('@/lib/auth/rate-limit');
  if (!checkRateLimit('accept-invite-ip', ip)) {
    return (
      <InviteError
        title={tAccept('invalidTitle')}
        message={tAccept('tooManyRequests')}
        backToSignIn={tAccept('backToSignIn')}
      />
    );
  }

  if (!token?.trim()) {
    return (
      <InviteError
        title={tAccept('invalidTitle')}
        message={tAccept('invalidOrMissing')}
        backToSignIn={tAccept('backToSignIn')}
      />
    );
  }

  const result = await validatePlatformInvite(token.trim());

  if (!result.ok) {
    return (
      <InviteError
        title={tAccept('invalidTitle')}
        message={getTranslatedInviteError(result.error, tAccept, tErrors)}
        backToSignIn={tAccept('backToSignIn')}
      />
    );
  }

  const session = await auth();
  const currentUser = session?.user;

  if (currentUser?.id) {
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    if (dbUser && dbUser.email.toLowerCase() === result.email.toLowerCase()) {
      const consumed = await consumePlatformInvite(token.trim());
      if (!consumed.ok) {
        return (
          <InviteError
            title={tAccept('invalidTitle')}
            message={getTranslatedInviteError(consumed.error, tAccept, tErrors)}
            backToSignIn={tAccept('backToSignIn')}
          />
        );
      }
      await applyPlatformRole(dbUser.id, result.platformRole, result.schoolId);
      await createAuditLog({
        action: 'invite_acceptance',
        userId: dbUser.id,
        metadata: {
          email: result.email,
          platformRole: result.platformRole,
          schoolId: result.schoolId,
        },
      });
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

  await redirectWithLocale(`/sign-up?email=${encodeURIComponent(result.email)}`);
}

async function applyPlatformRole(
  userId: number,
  platformRole: string,
  schoolId: string | null
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
}

function InviteError({
  title,
  message,
  backToSignIn,
}: {
  title: string;
  message: string;
  backToSignIn: string;
}) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
        <h1 className="text-xl font-semibold text-[#111827]">{title}</h1>
        <p className="mt-3 text-sm text-[#6b7280]">{message}</p>
        <a
          href="/sign-in"
          className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
        >
          {backToSignIn}
        </a>
      </div>
    </div>
  );
}
