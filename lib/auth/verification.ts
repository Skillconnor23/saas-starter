import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import { db } from '@/lib/db/drizzle';
import { emailVerificationTokens } from '@/lib/db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { sendVerificationEmail } from './email';

const TOKEN_BYTES = 32;
const EXPIRY_HOURS = 24;
/** Cooldown in ms - do not send another verification email within this window */
const VERIFICATION_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

export async function createVerificationToken(email: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

  await db.insert(emailVerificationTokens).values({
    email,
    tokenHash,
    expiresAt,
  });

  return token;
}

/** Returns true if we recently sent a verification email to this address (cooldown). */
async function isVerificationEmailInCooldown(email: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - VERIFICATION_COOLDOWN_MS);
  const [row] = await db
    .select({ id: emailVerificationTokens.id })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.email, email),
        gt(emailVerificationTokens.createdAt, cutoff),
        isNull(emailVerificationTokens.usedAt)
      )
    )
    .limit(1);
  return !!row;
}

/**
 * Send verification email only if not in cooldown. Prevents spam on repeated sign-in or resend.
 * Returns { sent: true } if email was sent, { sent: false } if skipped due to cooldown.
 */
export async function sendVerificationEmailIfNeeded(
  email: string
): Promise<{ sent: boolean }> {
  if (await isVerificationEmailInCooldown(email)) {
    return { sent: false };
  }
  const token = await createVerificationToken(email);
  await sendVerificationEmail(email, token);
  return { sent: true };
}

export async function verifyAndConsumeToken(
  token: string
): Promise<{ email: string } | null> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        gt(emailVerificationTokens.expiresAt, now),
        isNull(emailVerificationTokens.usedAt)
      )
    )
    .limit(1);

  if (!row) return null;

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(eq(emailVerificationTokens.id, row.id));

  return { email: row.email };
}
