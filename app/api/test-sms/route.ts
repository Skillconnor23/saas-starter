/**
 * TEMPORARY: Debug route to verify UniMTX SMS sending independently of the booking flow.
 * Use to confirm production can make outbound API requests and env vars are set.
 *
 * Set UNIMTX_TEST_PHONE (e.g. +97699112233) in Vercel env vars, then GET /api/test-sms
 * Remove or disable this route once debugging is complete.
 */

import { NextResponse } from 'next/server';
import { sendSmsViaUnimtx } from '@/lib/sms/unimtx';

const LOG_PREFIX = '[api/test-sms]';

export async function GET() {
  const accessKeyId = process.env.UNIMTX_ACCESS_KEY_ID;
  const signature = process.env.UNIMTX_SIGNATURE;
  const testPhone = process.env.UNIMTX_TEST_PHONE;
  const env = process.env.NODE_ENV;

  const diag = {
    hasKey: !!accessKeyId,
    hasSignature: !!signature,
    hasTestPhone: !!testPhone,
    env,
  };

  console.log(LOG_PREFIX, 'test route hit', diag);

  if (!testPhone?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'UNIMTX_TEST_PHONE not set',
        hint: 'Add UNIMTX_TEST_PHONE (e.g. +97699112233) to Vercel env vars',
        ...diag,
      },
      { status: 400 }
    );
  }

  const testMessage = `[Gecko test] SMS from ${env} at ${new Date().toISOString()}`;

  try {
    console.log(LOG_PREFIX, 'calling sendSmsViaUnimtx', { to: testPhone.slice(0, 6) + '***' });
    await sendSmsViaUnimtx(testPhone, testMessage);
    console.log(LOG_PREFIX, 'sendSmsViaUnimtx returned');
  } catch (e) {
    console.error(LOG_PREFIX, 'sendSmsViaUnimtx threw', e);
    return NextResponse.json(
      {
        ok: false,
        reason: 'Helper threw',
        error: e instanceof Error ? e.message : String(e),
        ...diag,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Helper completed. Check Vercel logs for [sms-unimtx] output.',
    ...diag,
  });
}
