import { verifyEmailAction } from './actions';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
          <h1 className="text-xl font-semibold text-[#111827]">Invalid link</h1>
          <p className="mt-3 text-sm text-[#6b7280]">
            This verification link is invalid or missing.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const result = await verifyEmailAction(token);

  if (result.success) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
          <h1 className="text-xl font-semibold text-[#111827]">Email verified</h1>
          <p className="mt-3 text-sm text-[#6b7280]">
            Your email has been verified. You can now sign in.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-block rounded-full bg-[#7daf41] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b9a39]"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
        <h1 className="text-xl font-semibold text-[#111827]">Verification failed</h1>
        <p className="mt-3 text-sm text-[#6b7280]">
          This link has expired or has already been used.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
