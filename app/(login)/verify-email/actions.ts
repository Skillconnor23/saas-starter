'use server';

import { validateToken, consumeToken } from '@/lib/auth/verification';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { createAuditLog } from '@/lib/auth/audit';

/**
 * Verify email via token. Updates users.email_verified (same field authorize() checks).
 * Only returns success if the user row was actually updated. Token is consumed only after
 * successful update to prevent "token consumed but user unverified" loop.
 */
export async function verifyEmailAction(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const tokenData = await validateToken(token);
  if (!tokenData) {
    if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
      console.log('[verify-email] Token invalid or expired');
    }
    return { success: false, error: 'Invalid or expired token' };
  }

  if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
    console.log('[verify-email] Verifying email:', tokenData.email);
  }

  const updated = await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(sql`lower(${users.email}) = lower(${tokenData.email})`)
    .returning({ id: users.id });

  if (updated.length === 0) {
    console.error('[verify-email] User not found for email:', tokenData.email);
    return {
      success: false,
      error: 'User not found. The account may have been deleted.',
    };
  }

  await consumeToken(tokenData.id);
  await createAuditLog({
    action: 'email_verification',
    userId: updated[0].id,
    metadata: { email: tokenData.email },
  });

  if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
    console.log('[verify-email] Success for user:', updated[0].id);
  }

  return { success: true };
}
