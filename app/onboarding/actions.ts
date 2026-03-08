'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/user';
import { getAllowedSelfServeRole } from '@/lib/auth/platform-role';
import { redirectWithLocale } from '@/lib/i18n/redirect';

/**
 * Self-service onboarding: assigns the ONLY allowed role (student).
 * Client input is NEVER trusted for role. Elevated roles require invitation.
 */
export async function setPlatformRole(
  prevState: { error?: string },
  _formData: FormData
): Promise<{ error?: string }> {
  const user = await requireAuth();

  const role = getAllowedSelfServeRole();

  await db
    .update(users)
    .set({ platformRole: role, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await redirectWithLocale('/dashboard');
  return {};
}
