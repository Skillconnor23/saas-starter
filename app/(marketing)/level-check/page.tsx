import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { getCurrentUserOrNull } from '@/lib/auth/user';
import { ArrowRight, CheckCircle2, Target } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LevelCheckLandingPage() {
  const t = await getTranslations('levelCheck.landing');
  const user = await getCurrentUserOrNull();
  const locale = await getLocale();

  const startHref = user
    ? `/${locale}/level-check/test`
    : `/${locale}/sign-in?redirect=${encodeURIComponent(`/${locale}/level-check/test`)}`;

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-16 md:pt-16 md:pb-24">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7daf41]/10">
            <Target className="h-7 w-7 text-[#7daf41]" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[#3d4236] md:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg text-slate-600 md:text-xl">
            {t('subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Button
              asChild
              size="lg"
              className="min-h-14 min-w-[240px] rounded-full bg-[#7daf41] text-lg font-semibold hover:bg-[#6b9a39]"
            >
              <Link href={startHref} className="inline-flex items-center gap-2">
                {t('startButton')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            {!user && (
              <p className="text-sm text-slate-500">
                {t('signInPrompt')}
              </p>
            )}
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-[#3d4236]">
            {t('whatToExpect.title')}
          </h2>
          <ul className="mt-4 space-y-3">
            {[
              { key: 'step1', icon: CheckCircle2 },
              { key: 'step2', icon: CheckCircle2 },
              { key: 'step3', icon: CheckCircle2 },
            ].map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#7daf41]" />
                <span className="text-slate-600">{t(`whatToExpect.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 text-center text-sm text-slate-500">
          {t('timeEstimate')}
        </div>
      </section>
    </div>
  );
}
