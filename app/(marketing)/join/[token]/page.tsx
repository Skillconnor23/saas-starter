export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { getInviteByTokenAction } from '@/lib/actions/class-invite';
import { getCurrentUserOrNull } from '@/lib/auth/user';
import type { PlatformRole } from '@/lib/db/schema';
import { defaultLocale } from '@/lib/i18n/config';
import { JoinInviteClient } from './JoinInviteClient';

const CLASS_INVITE_COOKIE_NAME = 'class_invite_token';
const COOKIE_MAX_AGE = 60 * 30; // 30 minutes (match setClassInviteCookie)
const INVITE_DEBUG = process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true';

function safeLog(msg: string, data?: unknown) {
  if (INVITE_DEBUG) {
    console.log('[join-invite]', msg, data ?? '');
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Join Gecko Academy',
    description: 'Apply to join an online English class at Gecko Academy.',
    openGraph: {
      title: 'Join Gecko Academy',
      description: 'Apply to join an online English class at Gecko Academy.',
      url: 'https://www.geckoacademy.net',
      siteName: 'Gecko Academy',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Gecko Academy',
        },
      ],
      type: 'website',
    },
  };
}

/** Fallback labels when i18n is unavailable (e.g. route without locale). */
const FALLBACK_LABELS = {
  invalidOrExpired: 'This invite link is invalid or has expired.',
  invalidOrExpiredHelp: 'Please ask your teacher or school for a new invite link.',
  joinThisClass: 'Join this class',
  classLabel: 'Class',
  createStudentAccount: 'Create student account',
  logIn: 'Log in',
  onlyStudentsCanJoin: 'Only student accounts can join a class via this link. Please sign in with a student account.',
} as const;

export default async function JoinInvitePage({
  params,
}: {
  params: Promise<{ token?: string }>;
}) {
  let t: (key: string) => string;
  let locale: string;

  try {
    const resolvedParams = await params;
    const token = typeof resolvedParams?.token === 'string' && resolvedParams.token.trim()
      ? resolvedParams.token.trim()
      : null;

    safeLog('invite token received', { token: token ? `${token.slice(0, 4)}...` : null });

    try {
      locale = (await getLocale()) || defaultLocale;
      const tJoin = await getTranslations('join.invite');
      t = (k: string) => tJoin(k);
    } catch (i18nErr) {
      safeLog('i18n fallback', { err: i18nErr instanceof Error ? i18nErr.message : String(i18nErr) });
      locale = defaultLocale;
      t = (k: string) => (k in FALLBACK_LABELS ? FALLBACK_LABELS[k as keyof typeof FALLBACK_LABELS] : k);
    }

    if (!token) {
      safeLog('no token, showing invalid');
      return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-[#111827]">{t('invalidOrExpired')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('invalidOrExpiredHelp')}</p>
        </div>
      </main>
      );
    }

    let invite: Awaited<ReturnType<typeof getInviteByTokenAction>> = null;
    try {
      invite = await getInviteByTokenAction(token);
      safeLog('invite lookup', { found: !!invite });
    } catch (inviteErr) {
      safeLog('invite lookup error', { err: inviteErr instanceof Error ? inviteErr.message : String(inviteErr) });
    }

    let user: Awaited<ReturnType<typeof getCurrentUserOrNull>> = null;
    try {
      user = await getCurrentUserOrNull();
      safeLog('user auth', { loggedIn: !!user });
    } catch (userErr) {
      safeLog('user lookup error', { err: userErr instanceof Error ? userErr.message : String(userErr) });
    }

    if (!invite) {
      return (
        <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-[#111827]">{t('invalidOrExpired')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('invalidOrExpiredHelp')}</p>
          </div>
        </main>
      );
    }

    const isStudent = (user?.platformRole as PlatformRole) === 'student';
    const isLoggedInAsStudent = !!user && isStudent;

    if (!user) {
      try {
        const cookieStore = await cookies();
        cookieStore.set(CLASS_INVITE_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: COOKIE_MAX_AGE,
        });
      } catch (cookieErr) {
        safeLog('cookie set error', { err: cookieErr instanceof Error ? cookieErr.message : String(cookieErr) });
      }
    }

    return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[#111827]">{t('joinThisClass')}</h1>
        {invite.className && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t('classLabel')}: <span className="font-medium text-foreground">{invite.className}</span>
          </p>
        )}
        <div className="mt-6">
          <JoinInviteClient
            token={token}
            isLoggedInAsStudent={isLoggedInAsStudent}
            labels={{
              joinThisClass: t('joinThisClass'),
              createStudentAccount: t('createStudentAccount'),
              logIn: t('logIn'),
            }}
          />
        </div>
        {user && !isStudent && (
          <p className="mt-4 text-sm text-amber-600">{t('onlyStudentsCanJoin')}</p>
        )}
      </div>
    </main>
  );
  } catch (err) {
    safeLog('join page error', { err: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-[#111827]">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t load this invite. Please try again or ask your teacher for a new link.
          </p>
        </div>
      </main>
    );
  }
}
