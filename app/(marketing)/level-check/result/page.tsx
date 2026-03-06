import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { getLocale } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/user';
import { GEKO_LEVEL_INFO } from '@/lib/level-check/level-info';
import type { GeckoLevel } from '@/lib/level-check/questions';
import { CheckCircle2, BookOpen } from 'lucide-react';
import { STUDENT_TRIAL_HREF } from '@/lib/routes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ score?: string; level?: string }>;
};

export default async function LevelCheckResultPage({ searchParams }: Props) {
  const user = await requireAuth();
  const t = await getTranslations('levelCheck.result');
  const params = await searchParams;
  const score = params.score ? parseInt(params.score, 10) : null;
  const level = (params.level ?? 'G') as GeckoLevel;
  const locale = await getLocale();

  const info = GEKO_LEVEL_INFO[level] ?? GEKO_LEVEL_INFO.G;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#7daf41]/15">
          <CheckCircle2 className="h-8 w-8 text-[#7daf41]" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#3d4236] md:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-slate-600">{t('subtitle')}</p>

        {/* Level badge */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#7daf41] px-6 py-3">
          <span className="text-2xl font-bold text-white md:text-3xl">{level}</span>
          <span className="text-lg font-medium text-white/90">— {info.name}</span>
        </div>
        {score !== null && (
          <p className="mt-3 text-sm text-slate-500">
            {t('scoreLabel')}: {score}
          </p>
        )}
      </div>

      {/* Level explanation */}
      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
        <h2 className="text-lg font-semibold text-[#3d4236]">
          {t('explanationTitle')}
        </h2>
        <p className="mt-3 text-slate-600">{info.description}</p>
      </div>

      {/* Recommended class */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#429ead]/10">
            <BookOpen className="h-5 w-5 text-[#429ead]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#3d4236]">
              {t('recommendedClassTitle')}
            </h2>
            <p className="mt-1 text-slate-600">{info.recommendedClass}</p>
          </div>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button
          asChild
          size="lg"
          className="min-h-12 min-w-[200px] rounded-full bg-[#7daf41] hover:bg-[#6b9a39]"
        >
          <Link href={`/${locale}${STUDENT_TRIAL_HREF}`} className="inline-flex items-center justify-center">
            {t('bookTrialButton')}
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="min-h-12 min-w-[200px] rounded-full border-slate-300"
        >
          <Link href={`/${locale}/academy`} className="inline-flex items-center justify-center">
            {t('viewClassesButton')}
          </Link>
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('resultSaved')}
      </p>
    </div>
  );
}
