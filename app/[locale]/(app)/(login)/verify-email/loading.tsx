import { getTranslations } from 'next-intl/server';

export default async function VerifyEmailLoading() {
  const t = await getTranslations('auth.verifyEmail');
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg sm:p-8 text-center">
        <div
          className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#429ead] border-t-transparent"
          aria-hidden
        />
        <p className="mt-4 text-sm text-[#6b7280]">{t('verifying')}</p>
      </div>
    </div>
  );
}
