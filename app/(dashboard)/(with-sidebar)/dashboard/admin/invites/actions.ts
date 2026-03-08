'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/permissions';
import { createPlatformInvite } from '@/lib/auth/invites';
import { createAuditLog } from '@/lib/auth/audit';
import { db } from '@/lib/db/drizzle';
import { platformInvites } from '@/lib/db/schema';
import { revokePlatformInvite } from '@/lib/db/queries/platform-invites';
import type { PlatformInviteRole } from '@/lib/db/schema';

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['teacher', 'school_admin', 'student']),
  schoolId: z.string().optional(),
  classId: z.string().optional(),
  inviterUserId: z.coerce.number(),
  locale: z.enum(['en', 'mn']).optional(),
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
    classId: formData.get('classId') || undefined,
    inviterUserId: formData.get('inviterUserId'),
    locale: formData.get('locale') || undefined,
  });

  if (!parsed.success) {
    return { success: null, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const { email, role, schoolId, classId, inviterUserId, locale } = parsed.data;

  if (role === 'school_admin') {
    if (user.platformRole === 'school_admin' && user.schoolId) {
      if (schoolId !== user.schoolId) {
        return { success: null, error: 'You can only invite school admins for your school.' };
      }
    } else if (!schoolId?.trim()) {
      return { success: null, error: 'School is required for school admin invites.' };
    }
  }

  if (role === 'student') {
    if (!classId?.trim()) {
      return { success: null, error: 'Class is required for student invites.' };
    }
  }

  const result = await createPlatformInvite({
    email,
    platformRole: role as PlatformInviteRole,
    schoolId: role === 'school_admin' ? schoolId ?? null : null,
    classId: role === 'student' ? classId ?? null : null,
    invitedByUserId: inviterUserId,
    locale: locale ?? null,
  });

  if (!result.ok) {
    return { success: null, error: result.error };
  }

  await createAuditLog({
    action: 'invite_creation',
    userId: inviterUserId,
    metadata: { email, platformRole: role, schoolId: schoolId ?? null, classId: classId ?? null },
  });

  revalidatePath('/dashboard/admin/invites');
  return { success: result.inviteLink, error: null };
}

/** Resend a platform invite (creates new invite for same email/role/school). */
export async function resendPlatformInviteAction(
  inviteId: string,
  locale?: string | null
): Promise<{ link: string | null; error: string | null }> {
  const user = await requirePermission('invites:create');

  const [inv] = await db.select().from(platformInvites).where(eq(platformInvites.id, inviteId)).limit(1);
  if (!inv) {
    return { link: null, error: 'Invite not found' };
  }

  const result = await createPlatformInvite({
    email: inv.email,
    platformRole: inv.platformRole as PlatformInviteRole,
    schoolId: inv.schoolId,
    classId: inv.classId ?? null,
    invitedByUserId: user.id,
    locale: locale ?? null,
  });

  if (!result.ok) {
    return { link: null, error: result.error };
  }

  await createAuditLog({
    action: 'invite_creation',
    userId: user.id,
    metadata: { email: inv.email, platformRole: inv.platformRole, schoolId: inv.schoolId, classId: inv.classId, resend: true },
  });

  revalidatePath('/dashboard/admin/invites');
  return { link: result.inviteLink, error: null };
}

/** Revoke a platform invite (expires it). */
export async function revokePlatformInviteAction(inviteId: string): Promise<{ error: string | null }> {
  await requirePermission('invites:create');

  const ok = await revokePlatformInvite(inviteId);
  if (!ok) {
    return { error: 'Invite not found' };
  }

  revalidatePath('/dashboard/admin/invites');
  return { error: null };
}
