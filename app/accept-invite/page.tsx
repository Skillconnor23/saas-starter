import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validatePlatformInvite, consumePlatformInvite } from '@/lib/auth/invites';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, schoolMemberships } from '@/lib/db/schema';
import { auth } from '@/auth';
import { createAuditLog } from '@/lib/auth/audit';

const PLATFORM_INVITE_COOKIE = 'pending_platform_invite';
const PLATFORM_INVITE_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export const dynamic = 'force-dynamic';

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token?.trim()) {
    return <InviteError message="Invalid or missing invite link." />;
  }

  const result = await validatePlatformInvite(token.trim());

  if (!result.ok) {
    return <InviteError message={result.error} />;
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
      if (!consumed.ok) return <InviteError message={consumed.error} />;
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
      redirect('/dashboard');
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

  redirect(`/sign-up?email=${encodeURIComponent(result.email)}`);
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

function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
        <h1 className="text-xl font-semibold text-[#111827]">Invite invalid</h1>
        <p className="mt-3 text-sm text-[#6b7280]">{message}</p>
        <a
          href="/sign-in"
          className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
}
