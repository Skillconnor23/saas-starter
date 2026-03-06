import { verifyEmailAction } from './actions';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = await getTranslations('auth.verifyEmail');
  const locale = await getLocale();
  const signInPath = `/${locale}/sign-in`;

  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
          <h1 className="text-xl font-semibold text-[#111827]">{t('invalidLinkTitle')}</h1>
          <p className="mt-3 text-sm text-[#6b7280]">{t('invalidLinkDesc')}</p>
          <Link
            href={signInPath}
            className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
          >
            {t('backToSignIn')}
          </Link>
        </div>
      </div>
    );
  }

  let result: { success: boolean; error?: string };
  try {
    result = await verifyEmailAction(token);
  } catch {
    result = { success: false, error: 'Verification failed' };
  }

  if (result.success) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
          <h1 className="text-xl font-semibold text-[#111827]">{t('successTitle')}</h1>
          <p className="mt-3 text-sm text-[#6b7280]">{t('successDesc')}</p>
          <Link
            href={signInPath}
            className="mt-6 inline-block rounded-full bg-[#7daf41] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b9a39]"
          >
            {t('signIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
        <h1 className="text-xl font-semibold text-[#111827]">{t('failedTitle')}</h1>
        <p className="mt-3 text-sm text-[#6b7280]">{t('failedDesc')}</p>
        <Link
          href={signInPath}
          className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
        >
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
