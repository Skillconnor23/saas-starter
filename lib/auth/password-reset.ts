import { randomBytes, createHash } from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { sendPasswordResetEmail } from './email';
import { hashPassword } from './session';

const TOKEN_BYTES = 32;
const EXPIRY_MINUTES = 60;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

/**
 * Create password reset token and send reset email.
 * locale: optional, e.g. 'en' or 'mn' for email language; defaults to English if missing.
 */
export async function createPasswordResetToken(
  userId: number,
  email: string,
  locale?: string | null
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  const sendResult = await sendPasswordResetEmail(email, token, locale);
  if (!sendResult.ok) {
    return { ok: false, error: sendResult.error ?? 'Unknown email send failure' };
  }
  return { ok: true, token };
}

/**
 * Validates token and returns userId if valid. Does NOT consume.
 */
export async function validatePasswordResetToken(
  token: string
): Promise<{ id: string; userId: number } | null> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [row] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, now),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);

  return row ? { id: row.id, userId: row.userId } : null;
}

/** Mark token as used. Call only after password is successfully updated. */
export async function consumePasswordResetToken(tokenId: string): Promise<void> {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenId));
}

/** Invalidate all other active reset tokens for this user (already-consumed token excluded by usedAt). */
export async function invalidateOtherResetTokensForUser(userId: number): Promise<void> {
  const now = new Date();
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    );
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const tokenData = await validatePasswordResetToken(token);
  if (!tokenData) {
    if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
      console.log('[password-reset] Token invalid or expired');
    }
    return { success: false, error: 'invalid_or_expired' };
  }

  if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
    console.log('[password-reset] Updating password for userId:', tokenData.userId);
  }

  const passwordHash = await hashPassword(newPassword);

  const updated = await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, tokenData.userId))
    .returning({ id: users.id });

  if (updated.length === 0) {
    console.error('[password-reset] No rows updated for userId:', tokenData.userId);
    return { success: false, error: 'invalid_or_expired' };
  }

  await consumePasswordResetToken(tokenData.id);
  await invalidateOtherResetTokensForUser(tokenData.userId);

  if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
    console.log('[password-reset] Password updated for user:', updated[0].id);
  }

  return { success: true };
}
