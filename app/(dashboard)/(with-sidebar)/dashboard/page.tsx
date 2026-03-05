import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getCurrentUserOrNull } from '@/lib/auth/user';
import { getRoleDashboardPath } from '@/lib/auth/dashboard-redirect';
import type { PlatformRole } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

/**
 * /dashboard (or /[locale]/dashboard): role-based redirect. Never renders content.
 * - Unauthenticated -> sign-in with next preserved
 * - No platform role -> onboarding/role (then redirects to role dashboard)
 * - Otherwise -> role dashboard (student, teacher, admin, school-admin)
 */
export default async function DashboardPage() {
  const locale = await getLocale();
  const user = await getCurrentUserOrNull();

  if (!user) {
    const signInUrl = `/${locale}/sign-in?redirect=${encodeURIComponent(`/${locale}/dashboard`)}`;
    redirect(signInUrl);
  }

  const role = user.platformRole as PlatformRole | null;
  if (!role) {
    redirect(`/${locale}/onboarding/role`);
  }

  const path = getRoleDashboardPath(role);
  redirect(`/${locale}${path}`);
}
