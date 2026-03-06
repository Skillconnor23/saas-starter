import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import { db } from '@/lib/db/drizzle';
import { emailVerificationTokens } from '@/lib/db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { sendVerificationEmail } from './email';

const TOKEN_BYTES = 32;
const EXPIRY_HOURS = 24;

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
