const LOG_PREFIX = '[sms-unimtx]';

const UNIMTX_ENDPOINT = 'https://api.unimtx.com';
const UNIMTX_ACCESS_KEY_ID = process.env.UNIMTX_ACCESS_KEY_ID;
const UNIMTX_SIGNATURE = process.env.UNIMTX_SIGNATURE;

/**
 * Normalize a phone number to E.164.
 * - If it already looks like E.164 (+XXXXXXXX), return as-is.
 * - Otherwise, try to build it using a default country (MN or US).
 * - Returns null if it cannot be normalized safely.
 */
export function normalizePhoneToE164(
  raw: string | null | undefined,
  defaultCountry: 'MN' | 'US' = 'MN'
): string | null {
  console.log(LOG_PREFIX, 'normalizePhoneToE164 called', { raw, defaultCountry });
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already in E.164-style format: + and digits only, 8–15 digits.
  if (trimmed.startsWith('+')) {
    const cleaned = trimmed.replace(/[^\d+]/g, '');
    if (/^\+\d{8,15}$/.test(cleaned)) {
      return cleaned;
    }
    return null;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (defaultCountry === 'MN') {
    // Common Mongolian mobile numbers: 8 digits, prepend +976.
    if (digits.length === 8) {
      return `+976${digits}`;
    }
    // Already includes 976 country code without +.
    if (digits.length === 11 && digits.startsWith('976')) {
      return `+${digits}`;
    }
  }

  if (defaultCountry === 'US') {
    // Standard US numbers: 10 digits, prepend +1.
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    // Already includes leading 1 as country code.
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
  }

  // Fallback: treat as already including country code (no +).
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

/**
 * Send an SMS via UniMTX.
 *
 * NOTES:
 * - Expects phone numbers in (or convertible to) E.164.
 * - In development, when UNIMTX_ENABLE_SMS !== 'true', this logs instead of sending.
 * - Failures are logged but not thrown (so booking, etc. are not blocked).
 */
export async function sendSmsViaUnimtx(toRaw: string, text: string): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development';
  const smsEnabled = process.env.UNIMTX_ENABLE_SMS === 'true';

  console.log(LOG_PREFIX, 'sendSmsViaUnimtx invoked', {
    env: process.env.NODE_ENV,
    smsEnabled,
    toRaw,
    textLength: text?.length ?? 0,
  });

  const to = normalizePhoneToE164(toRaw, 'MN');
  if (!to) {
    console.warn(LOG_PREFIX, 'skip send: invalid phone', { toRaw });
    return;
  }

  if (!UNIMTX_ACCESS_KEY_ID) {
    console.warn(LOG_PREFIX, 'skip send: UNIMTX_ACCESS_KEY_ID not configured');
    return;
  }

  if (!text?.trim()) {
    console.warn(LOG_PREFIX, 'skip send: empty text');
    return;
  }

  if (isDev && !smsEnabled) {
    console.log(LOG_PREFIX, '(dev) would send SMS (UNIMTX_ENABLE_SMS!=true)', {
      to,
      preview: text.slice(0, 80),
    });
    return;
  }

  const url = `${UNIMTX_ENDPOINT}/?action=sms.message.send&accessKeyId=${encodeURIComponent(
    UNIMTX_ACCESS_KEY_ID
  )}`;

  const body: Record<string, unknown> = {
    to,
    // UniMTX accepts either `text` or `content`; docs examples use `text`.
    text,
    content: text,
  };
  if (UNIMTX_SIGNATURE) {
    body.signature = UNIMTX_SIGNATURE;
  }

  try {
    console.log(LOG_PREFIX, 'sending request to UniMTX', {
      url: UNIMTX_ENDPOINT,
      to,
      hasSignature: !!UNIMTX_SIGNATURE,
      textLength: text.length,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(LOG_PREFIX, 'UniMTX response status', res.status);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '<no body>');
      console.error(LOG_PREFIX, 'UniMTX API error', {
        status: res.status,
        body: errorText,
      });
      return;
    }

    const respText = await res.text().catch(() => '<no body>');
    console.log(LOG_PREFIX, 'SMS sent successfully', {
      to,
      body: respText,
    });
  } catch (err) {
    console.error(LOG_PREFIX, 'UniMTX request failed', err);
  }
}

