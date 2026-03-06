'use server';

import { z } from 'zod';
import { requirePermission } from '@/lib/auth/permissions';
import { createPlatformInvite } from '@/lib/auth/invites';
import { createAuditLog } from '@/lib/auth/audit';
import type { PlatformInviteRole } from '@/lib/db/schema';

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['teacher', 'school_admin']),
  schoolId: z.string().optional(),
  inviterUserId: z.coerce.number(),
});

export async function createPlatformInviteAction(
  _prev: { success: string | null; error: string | null },
  formData: FormData
): Promise<{ success: string | null; error: string | null }> {
  const user = await requirePermission('invites:create');
  if (user.id !== Number(formData.get('inviterUserId'))) {
    return { success: null, error: 'Unauthorized' };
  }

  const parsed = schema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
    schoolId: formData.get('schoolId') || undefined,
    inviterUserId: formData.get('inviterUserId'),
  });

  if (!parsed.success) {
    return { success: null, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const { email, role, schoolId, inviterUserId } = parsed.data;

  if (role === 'school_admin') {
    if (user.platformRole === 'school_admin' && user.schoolId) {
      if (schoolId !== user.schoolId) {
        return { success: null, error: 'You can only invite school admins for your school.' };
      }
    } else if (!schoolId?.trim()) {
      return { success: null, error: 'School is required for school admin invites.' };
    }
  }

  const result = await createPlatformInvite({
    email,
    platformRole: role as PlatformInviteRole,
    schoolId: role === 'school_admin' ? schoolId ?? null : null,
    invitedByUserId: inviterUserId,
  });

  if (!result.ok) {
    return { success: null, error: result.error };
  }

  await createAuditLog({
    action: 'invite_creation',
    userId: inviterUserId,
    metadata: { email, platformRole: role, schoolId: schoolId ?? null },
  });

  return { success: result.inviteLink, error: null };
}
