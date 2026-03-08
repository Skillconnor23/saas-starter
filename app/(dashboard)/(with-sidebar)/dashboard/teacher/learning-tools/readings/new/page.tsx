export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { listClassesForTeacher } from '@/lib/db/queries/education';
import { createReadingAction } from '@/lib/actions/learning/readings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerateReadingButton } from '@/components/learning/GenerateReadingButton';
import { ArrowLeft } from 'lucide-react';

export default async function NewReadingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const t = await getTranslations('teacher.readings');
  const classes = await listClassesForTeacher(user.id);
  const { error } = await searchParams;

  return (
    <section className="flex-1">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-1 min-h-10">
          <Link
            href="/dashboard/teacher/learning-tools"
            className="flex items-center gap-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToLearningTools')}
          </Link>
        </Button>

        <div>
          <h1 className="text-xl font-medium text-[#1f2937] tracking-tight sm:text-2xl">
            {t('newTitle')}
          </h1>
        </div>

        {error && (
          <p className="rounded-xl border border-[#b64b29] bg-[#b64b29]/5 px-4 py-2 text-sm text-[#b64b29]">
            {error === 'missing' ? 'Please fill in required fields.' : 'You do not have access to that class.'}
          </p>
        )}

        {classes.length === 0 ? (
          <Card className="rounded-2xl border border-[#e5e7eb]">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                {t('noClassesYet')}
              </p>
              <Button asChild variant="secondary" className="mt-4">
                <Link href="/dashboard/teacher/learning-tools">{t('cancel')}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">{t('newTitle')}</CardTitle>
                <GenerateReadingButton classes={classes} label={t('generateWithAI')} />
              </div>
            </CardHeader>
            <CardContent>
              <form action={createReadingAction} className="space-y-5">
                <div>
                  <label htmlFor="classId" className="block text-sm font-medium text-[#1f2937]">
                    {t('classLabel')} <span className="text-[#b64b29]">*</span>
                  </label>
                  <select
                    id="classId"
                    name="classId"
                    required
                    className="mt-1 w-full min-h-10 rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  >
                    <option value="">{t('selectClass')}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[#1f2937]">
                    {t('titleLabel')} <span className="text-[#b64b29]">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    className="mt-1 w-full min-h-10 rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-[#1f2937]">
                    {t('readingTextLabel')} <span className="text-[#b64b29]">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    rows={10}
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="vocabulary" className="block text-sm font-medium text-[#1f2937]">
                    {t('vocabularyLabel')}
                  </label>
                  <textarea
                    id="vocabulary"
                    name="vocabulary"
                    rows={4}
                    placeholder={t('vocabularyPlaceholder')}
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="questions" className="block text-sm font-medium text-[#1f2937]">
                    {t('questionsLabel')}
                  </label>
                  <textarea
                    id="questions"
                    name="questions"
                    rows={4}
                    placeholder={t('questionsPlaceholder')}
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button type="submit" className="min-h-10 rounded-full bg-[#429ead] text-white hover:bg-[#36899a]">
                    {t('save')}
                  </Button>
                  <Button type="button" variant="secondary" className="min-h-10 rounded-full" asChild>
                    <Link href="/dashboard/teacher/learning-tools">{t('cancel')}</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
