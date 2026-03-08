export const dynamic = 'force-dynamic';

import { redirectWithLocale } from '@/lib/i18n/redirect';
import { requireRole } from '@/lib/auth/user';
import { getPrimaryClassForStudent } from '@/lib/db/queries/education';

/** Redirect to canonical classroom route. */
export default async function StudentClassPage() {
  const user = await requireRole(['student']);
  const primaryClass = await getPrimaryClassForStudent(user.id);

  if (!primaryClass) {
    await redirectWithLocale('/dashboard/student/join');
  }

  await redirectWithLocale(`/classroom/${primaryClass!.id}`);
}
