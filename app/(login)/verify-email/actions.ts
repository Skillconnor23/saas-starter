'use server';

import { verifyAndConsumeToken } from '@/lib/auth/verification';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { createAuditLog } from '@/lib/auth/audit';

export async function verifyEmailAction(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await verifyAndConsumeToken(token);
  if (!result) {
    return { success: false, error: 'Invalid or expired token' };
  }

  await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.email, result.email));

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, result.email))
    .limit(1);

  if (user) {
    await createAuditLog({
      action: 'email_verification',
      userId: user.id,
      metadata: { email: result.email },
    });
  }

  return { success: true };
}
