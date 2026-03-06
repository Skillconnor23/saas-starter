import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@example.com';

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  if (!resend) {
    console.log('[DEV] Verification email would be sent to:', email);
    console.log('[DEV] Verify URL:', verifyUrl);
    return { ok: true };
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your email address',
    html: `
      <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    return { ok: false, error };
  }
  return { ok: true };
}

export async function sendPlatformInviteEmail(
  email: string,
  role: string,
  schoolName: string | null,
  token: string
) {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/accept-invite?token=${encodeURIComponent(token)}`;

  if (!resend) {
    console.log('[DEV] Invite email would be sent to:', email);
    console.log('[DEV] Invite URL:', inviteUrl);
    return { ok: true };
  }

  const roleLabel = role === 'school_admin' ? 'School Admin' : 'Teacher';
  const context = schoolName ? ` at ${schoolName}` : '';

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `You've been invited as ${roleLabel}${context}`,
    html: `
      <p>You've been invited to join as a ${roleLabel}${schoolName ? ` at ${schoolName}` : ''}.</p>
      <p><a href="${inviteUrl}">Accept invitation</a></p>
      <p>This link expires in 7 days and can only be used once.</p>
    `,
  });

  if (error) {
    console.error('Failed to send invite email:', error);
    return { ok: false, error };
  }
  return { ok: true };
}
