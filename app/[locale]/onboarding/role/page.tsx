import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getLocale } from 'next-intl/server';
import { getCurrentUserOrNull } from '@/lib/auth/user';
import { getRoleDashboardPath } from '@/lib/auth/dashboard-redirect';
import { getAllowedSelfServeRole } from '@/lib/auth/platform-role';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import type { PlatformRole } from '@/lib/db/schema';

/**
 * Redirects to role dashboard. If user has no role, assign student (self-serve default) then redirect.
 * Elevated roles are invitation-only; this path never assigns them.
 */
export const dynamic = 'force-dynamic';

export default async function OnboardingRolePage() {
  const user = await getCurrentUserOrNull();
  const locale = await getLocale();
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }
  let role = user.platformRole as PlatformRole | null;
  if (!role) {
    const defaultRole = getAllowedSelfServeRole();
    await db
      .update(users)
      .set({ platformRole: defaultRole, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    role = defaultRole;
  }
  const path = getRoleDashboardPath(role);
  redirect(`/${locale}${path}`);
}
