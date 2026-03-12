const LOG_PREFIX = '[sms-unimtx]';

const UNIMTX_ENDPOINT = 'https://api.unimtx.com';

/**
 * Read env at call time (not module load) so Vercel runtime injects correctly.
 */
function getUnimtxEnv() {
  return {
    accessKeyId: process.env.UNIMTX_ACCESS_KEY_ID ?? undefined,
    signature: process.env.UNIMTX_SIGNATURE ?? undefined,
  };
}

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
  const { accessKeyId, signature } = getUnimtxEnv();
  const isDev = process.env.NODE_ENV === 'development';
  const smsEnabled = process.env.UNIMTX_ENABLE_SMS === 'true';

  const diag = {
    hasKey: !!accessKeyId,
    hasSignature: !!signature,
    env: process.env.NODE_ENV,
    smsEnabled,
    toRaw: toRaw ? `${toRaw.slice(0, 4)}***` : '',
    textLength: text?.length ?? 0,
  };
  console.log(LOG_PREFIX, 'ENTRY sendSmsViaUnimtx', diag);

  const to = normalizePhoneToE164(toRaw, 'MN');
  if (!to) {
    console.warn(LOG_PREFIX, 'EARLY_RETURN: invalid phone', { toRaw });
    return;
  }

  if (!accessKeyId) {
    console.warn(LOG_PREFIX, 'EARLY_RETURN: UNIMTX_ACCESS_KEY_ID missing');
    return;
  }

  if (!text?.trim()) {
    console.warn(LOG_PREFIX, 'EARLY_RETURN: empty text');
    return;
  }

  if (isDev && !smsEnabled) {
    console.log(LOG_PREFIX, 'EARLY_RETURN: dev mode and UNIMTX_ENABLE_SMS!=true', { to });
    return;
  }

  const url = `${UNIMTX_ENDPOINT}/?action=sms.message.send&accessKeyId=${encodeURIComponent(
    accessKeyId
  )}`;

  const body: Record<string, unknown> = {
    to,
    text,
    content: text,
  };
  if (signature) {
    body.signature = signature;
  }

  try {
    console.log(LOG_PREFIX, 'FETCH_START', { to, urlHost: UNIMTX_ENDPOINT });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(LOG_PREFIX, 'FETCH_DONE', { status: res.status });

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

