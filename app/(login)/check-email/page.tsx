import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function CheckEmailPage() {
  const t = await getTranslations('auth.checkEmail');
  const locale = await getLocale();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
        <h1 className="text-xl font-semibold text-[#111827]">{t('title')}</h1>
        <p className="mt-3 text-sm text-[#6b7280]">{t('description')}</p>
        <Link
          href={`/${locale}/sign-in`}
          className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
        >
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
