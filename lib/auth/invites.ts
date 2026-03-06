import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  platformInvites,
  schoolMemberships,
  schools,
  users,
} from '@/lib/db/schema';
import type { PlatformInviteRole } from '@/lib/db/schema';
import { sendPlatformInviteEmail } from './email';

const TOKEN_BYTES = 32;
const EXPIRY_DAYS = 7;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

export type CreatePlatformInviteParams = {
  email: string;
  platformRole: PlatformInviteRole;
  schoolId?: string | null;
  invitedByUserId: number;
};

export async function createPlatformInvite(
  params: CreatePlatformInviteParams
): Promise<{ ok: true; inviteLink: string } | { ok: false; error: string }> {
  const { email, platformRole, schoolId, invitedByUserId } = params;

  if (platformRole === 'school_admin' && !schoolId) {
    return { ok: false, error: 'School is required for school_admin invites' };
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(platformInvites).values({
    email,
    platformRole,
    schoolId: schoolId ?? null,
    tokenHash,
    expiresAt,
    invitedByUserId,
  });

  const schoolName =
    schoolId && platformRole === 'school_admin'
      ? (
          await db
            .select({ name: schools.name })
            .from(schools)
            .where(eq(schools.id, schoolId))
            .limit(1)
        )[0]?.name ?? null
      : null;

  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const inviteLink = `${baseUrl}/accept-invite?token=${encodeURIComponent(token)}`;

  await sendPlatformInviteEmail(email, platformRole, schoolName, token);

  return { ok: true, inviteLink };
}

/** Validate invite without consuming. Use for redirect flow. */
export async function validatePlatformInvite(token: string): Promise<
  | { ok: true; email: string; platformRole: PlatformInviteRole; schoolId: string | null }
  | { ok: false; error: string }
> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [invite] = await db
    .select()
    .from(platformInvites)
    .where(
      and(
        eq(platformInvites.tokenHash, tokenHash),
        gt(platformInvites.expiresAt, now),
        isNull(platformInvites.usedAt)
      )
    )
    .limit(1);

  if (!invite) {
    return { ok: false, error: 'Invalid or expired invite' };
  }

  return {
    ok: true,
    email: invite.email,
    platformRole: invite.platformRole as PlatformInviteRole,
    schoolId: invite.schoolId,
  };
}

/** Consume invite and return data. Call only when applying role. */
export async function consumePlatformInvite(token: string): Promise<
  | { ok: true; email: string; platformRole: PlatformInviteRole; schoolId: string | null }
  | { ok: false; error: string }
> {
  const result = await validatePlatformInvite(token);
  if (!result.ok) return result;

  const tokenHash = hashToken(token);
  const now = new Date();

  await db
    .update(platformInvites)
    .set({ usedAt: now })
    .where(eq(platformInvites.tokenHash, tokenHash));

  return result;
}

/** Alias for backwards compatibility. */
export const acceptPlatformInvite = consumePlatformInvite;
