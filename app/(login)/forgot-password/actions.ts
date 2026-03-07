'use server';

import { z } from 'zod';
import { and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { createPasswordResetToken } from '@/lib/auth/password-reset';
import { checkRateLimit } from '@/lib/auth/rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').min(3).max(255),
});

export async function submitForgotPassword(
  _prev: { submitted?: boolean } | null,
  formData: FormData
) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email')?.toString()?.trim(),
  });

  if (!parsed.success) {
    if (isDev) console.log('[forgot-password] Validation failed');
    return { submitted: true };
  }

  const email = parsed.data.email;

  if (!checkRateLimit('forgot-password', email)) {
    if (isDev) console.log('[forgot-password] Rate limited:', email);
    return { submitted: true };
  }
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      and(
        sql`lower(${users.email}) = lower(${email})`,
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  if (!user) {
    if (isDev) console.log('[forgot-password] User not found for email:', email);
    return { submitted: true };
  }

  const result = await createPasswordResetToken(user.id, user.email);
  if (!result.ok) {
    console.error('[forgot-password] Token created but email send failed:', result.error, '| user:', user.id);
  } else if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
    console.log('[forgot-password] Reset token created and email sent to:', user.email);
  }

  return { submitted: true };
}
