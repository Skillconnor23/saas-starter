import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getCurrentUserOrNull } from '@/lib/auth/user';
import { getRoleDashboardPath } from '@/lib/auth/dashboard-redirect';
import type { PlatformRole } from '@/lib/db/schema';

/**
 * Legacy route: no role selection. Redirects to the correct dashboard by existing DB role.
 * Users cannot self-assign teacher/admin/school_admin; default signup role is student.
 */
export const dynamic = 'force-dynamic';

export default async function OnboardingRolePage() {
  const user = await getCurrentUserOrNull();
  const locale = await getLocale();
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }
  const path = getRoleDashboardPath((user.platformRole as PlatformRole) ?? null);
  redirect(`/${locale}${path}`);
}
