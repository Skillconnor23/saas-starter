'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { resetPasswordWithToken } from '@/lib/auth/password-reset';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  });

export async function resetPasswordAction(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token')?.toString()?.trim(),
    password: formData.get('password')?.toString(),
    confirmPassword: formData.get('confirmPassword')?.toString(),
  });

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  if (!checkRateLimit('reset-password-ip', ip)) {
    return { success: false, error: 'invalid_or_expired' };
  }

  if (!parsed.success) {
    const err = parsed.error.flatten();
    const first =
      err.fieldErrors.password?.[0] || err.fieldErrors.confirmPassword?.[0];
    return {
      success: false,
      error: first === 'mismatch' ? 'passwordMismatch' : 'invalidInput',
    };
  }

  const result = await resetPasswordWithToken(
    parsed.data.token,
    parsed.data.password
  );

  if (!result.success) {
    return { success: false, error: result.error || 'invalid_or_expired' };
  }

  return { success: true };
}
