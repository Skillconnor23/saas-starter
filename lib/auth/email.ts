import { Resend } from 'resend';
import { getBaseUrl } from '@/lib/config/url';
import { isLocale, type Locale } from '@/lib/i18n/config';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@example.com';

if (process.env.NODE_ENV === 'production' && !resend) {
  console.error('[auth/email] RESEND_API_KEY not set — verification and password reset emails will NOT be sent');
}

/** Email copy for transactional auth emails. Default locale: en. */
const emailCopy = {
  verification: {
    en: {
      subject: 'Verify your email – Gecko Academy',
      title: 'Verify your email',
      body: 'Thanks for signing up for Gecko Academy. Click the button below to verify your email and complete your account setup.',
      cta: 'Verify email',
      fallbackLabel: 'If the button doesn\'t work, copy and paste this link into your browser:',
      securityNote: 'This link expires in 24 hours. If you didn\'t create an account, you can ignore this email.',
      plainText: (url: string) =>
        `Verify your email – Gecko Academy\n\n` +
        `Thanks for signing up for Gecko Academy. Verify your email by visiting:\n${url}\n\n` +
        `This link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    },
    mn: {
      subject: 'И-мэйлээ баталгаажуулна уу – Gecko Academy',
      title: 'И-мэйлээ баталгаажуулна уу',
      body: 'Gecko Academy-д бүртгүүлсэнд баярлалаа. И-мэйлээ баталгаажуулж данс тохируулахаа дуусгахын тулд доорх товчийг дарна уу.',
      cta: 'И-мэйл баталгаажуулах',
      fallbackLabel: 'Хэрэв товч ажиллахгүй бол энэ холбоосыг хуулж хөтөч рүүгээ оруулна уу:',
      securityNote: 'Энэ холбоос 24 цагийн дараа хүчингүй болно. Хэрэв та данс үүсгээгүй бол энэ и-мэйлийг үл тоомсорлож болно.',
      plainText: (url: string) =>
        `И-мэйлээ баталгаажуулна уу – Gecko Academy\n\n` +
        `Gecko Academy-д бүртгүүлсэнд баярлалаа. И-мэйлээ баталгаажуулахын тулд энд очно уу:\n${url}\n\n` +
        `Энэ холбоос 24 цагийн дараа хүчингүй болно. Хэрэв та данс үүсгээгүй бол энэ и-мэйлийг үл тоомсорлож болно.`,
    },
  },
  passwordReset: {
    en: {
      subject: 'Reset your password – Gecko Academy',
      title: 'Reset your password',
      body: 'You requested a password reset for your Gecko Academy account. Click the button below to choose a new password.',
      cta: 'Reset password',
      fallbackLabel: 'If the button doesn\'t work, copy and paste this link into your browser:',
      securityNote: 'This link expires in 60 minutes and can only be used once. If you didn\'t request this, you can safely ignore this email.',
      plainText: (url: string) =>
        `Reset your password – Gecko Academy\n\n` +
        `You requested a password reset. Visit this link to set a new password:\n${url}\n\n` +
        `This link expires in 60 minutes and can only be used once. If you didn't request this, you can safely ignore this email.`,
    },
    mn: {
      subject: 'Нууц үгээ солих – Gecko Academy',
      title: 'Нууц үгээ солих',
      body: 'Та Gecko Academy дансныхаа нууц үгийг солих хүсэлт илгээсэн. Шинэ нууц үг тохируулахын тулд доорх товчийг дарна уу.',
      cta: 'Нууц үг солих',
      fallbackLabel: 'Хэрэв товч ажиллахгүй бол энэ холбоосыг хуулж хөтөч рүүгээ оруулна уу:',
      securityNote: 'Энэ холбоос 60 минутын дараа хүчингүй бөгөөд нэг удаа ашиглах боломжтой. Хэрэв та энэ хүсэлт илгэээгүй бол энэ и-мэйлийг үл тоомсорлож болно.',
      plainText: (url: string) =>
        `Нууц үгээ солих – Gecko Academy\n\n` +
        `Та нууц үг солих хүсэлт илгээсэн. Шинэ нууц үг тохируулахын тулд энд очно уу:\n${url}\n\n` +
        `Энэ холбоос 60 минутын дараа хүчингүй бөгөөд нэг удаа ашиглах боломжтой. Хэрэв та энэ хүсэлт илгэээгүй бол энэ и-мэйлийг үл тоомсорлож болно.`,
    },
  },
} as const;

function resolveLocale(locale: string | undefined | null): Locale {
  return isLocale(locale) ? locale : 'en';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type TransactionalEmailCopy = {
  title: string;
  body: string;
  cta: string;
  fallbackLabel: string;
  securityNote: string;
  plainText: (url: string) => string;
};

/**
 * Build Gecko Academy branded transactional email HTML.
 * Uses inline styles and simple table layout for deliverability.
 */
function buildTransactionalEmailHtml(copy: TransactionalEmailCopy, linkUrl: string): string {
  const escapedUrl = escapeHtml(linkUrl);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
<tr><td style="padding:32px 24px;">
<h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#111827;">Gecko Academy</h1>
<h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1f2937;">${copy.title}</h2>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${copy.body}</p>
<table cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background-color:#7daf41;">
<a href="${escapedUrl}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${copy.cta}</a>
</td></tr></table>
<p style="margin:24px 0 8px;font-size:13px;color:#6b7280;">${copy.fallbackLabel}</p>
<p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#9ca3af;">${escapedUrl}</p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">${copy.securityNote}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const lang = resolveLocale(locale);
  const copy = emailCopy.verification[lang];

  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[verification] DEV: Would send verification email');
      return { ok: true };
    }
    console.error('[verification] RESEND_API_KEY not set in production — verification email not sent');
    return { ok: false, error: 'Email provider not configured' };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[verification] Sending verification email');
  }

  const html = buildTransactionalEmailHtml(copy, verifyUrl);
  const text = copy.plainText(verifyUrl);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: copy.subject,
    html,
    text,
  });

  if (error) {
    const errMsg = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
    console.error('[verification] Resend failed:', errMsg);
    return { ok: false, error: errMsg };
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[verification] Verification email sent');
  }
  return { ok: true };
}

export async function sendPlatformInviteEmail(
  email: string,
  role: string,
  schoolName: string | null,
  token: string
) {
  const baseUrl = getBaseUrl();
  const inviteUrl = `${baseUrl}/accept-invite?token=${encodeURIComponent(token)}`;

  if (!resend) {
    console.log('[DEV] Invite email would be sent');
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

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const lang = resolveLocale(locale);
  const copy = emailCopy.passwordReset[lang];

  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEV] Password reset email would be sent');
      return { ok: true };
    }
    console.error('[password-reset] RESEND_API_KEY not set in production — password reset email not sent');
    return { ok: false, error: 'Email provider not configured' };
  }

  const html = buildTransactionalEmailHtml(copy, resetUrl);
  const text = copy.plainText(resetUrl);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: copy.subject,
    html,
    text,
  });

  if (error) {
    const errMsg = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
    console.error('[password-reset] Resend failed:', errMsg);
    return { ok: false, error: errMsg };
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEV] Password reset email sent');
  }
  return { ok: true };
}
