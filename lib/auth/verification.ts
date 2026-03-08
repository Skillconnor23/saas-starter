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

  if (process.env.NODE_ENV !== 'production') {
    console.log('[verification] Generating token');
  }

  await db.insert(emailVerificationTokens).values({
    email,
    tokenHash,
    expiresAt,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('[verification] Token saved to DB');
  }

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
 * Returns { sent: true } if email was sent, { sent: false, error?: string } otherwise.
 * locale: optional, e.g. 'en' or 'mn' for language; defaults to English if missing.
 */
export async function sendVerificationEmailIfNeeded(
  email: string,
  locale?: string | null
): Promise<{ sent: boolean; error?: string }> {
  if (await isVerificationEmailInCooldown(email)) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[verification] Skipped (cooldown)');
    }
    return { sent: false };
  }
  const token = await createVerificationToken(email);
  const result = await sendVerificationEmail(email, token, locale);
  if (!result.ok) {
    console.error('[verification] Email send failed:', result.error);
    return { sent: false, error: result.error };
  }
  return { sent: true };
}

/**
 * Validates token and returns email if valid. Does NOT consume the token.
 * Use with consumeToken() after successfully updating the user.
 */
export async function validateToken(
  token: string
): Promise<{ id: string; email: string } | null> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [row] = await db
    .select({ id: emailVerificationTokens.id, email: emailVerificationTokens.email })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        gt(emailVerificationTokens.expiresAt, now),
        isNull(emailVerificationTokens.usedAt)
      )
    )
    .limit(1);

  return row ? { id: row.id, email: row.email } : null;
}

/** Marks a token as used. Call only after the user has been successfully verified. */
export async function consumeToken(tokenId: string): Promise<void> {
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, tokenId));
}

export async function verifyAndConsumeToken(
  token: string
): Promise<{ email: string } | null> {
  const row = await validateToken(token);
  if (!row) return null;

  await consumeToken(row.id);
  return { email: row.email };
}
