export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { listTeacherQuizzesForUser } from '@/lib/db/queries/quizzes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function TeacherQuizzesPage() {
  const user = await requireRole(['teacher']);
  const t = await getTranslations('teacher.quizzes');
  const rows = await listTeacherQuizzesForUser(user.id);

  const drafts = rows.filter((r) => r.quiz.status === 'DRAFT');
  const published = rows.filter((r) => r.quiz.status === 'PUBLISHED');

  return (
    <section className="flex-1">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Button
          asChild
          className="rounded-full bg-[#429ead] text-white hover:border-[#429ead] hover:bg-[#36899a]"
        >
          <Link href="/teacher/quizzes/new">{t('newQuiz')}</Link>
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('drafts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('noDraftsYet')}
              </p>
            ) : (
              drafts.map(({ quiz, className }) => (
                <div
                  key={quiz.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-[#1f2937]">{quiz.title}</p>
                    <p className="text-xs text-muted-foreground">{className}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      className="rounded-full bg-[#429ead] text-white hover:border-[#429ead] hover:bg-[#36899a]"
                      size="sm"
                    >
                      <Link href={`/teacher/quizzes/${quiz.id}/edit`}>{t('edit')}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link href={`/teacher/quizzes/${quiz.id}/results`}>
                        {t('results')}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('published')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {published.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('noPublishedYet')}
              </p>
            ) : (
              published.map(({ quiz, className }) => (
                <div
                  key={quiz.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-[#1f2937]">{quiz.title}</p>
                    <p className="text-xs text-muted-foreground">{className}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full bg-[#429ead] text-white hover:border-[#429ead] hover:bg-[#36899a]"
                    >
                      <Link href={`/teacher/quizzes/${quiz.id}/edit`}>{t('edit')}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link href={`/teacher/quizzes/${quiz.id}/results`}>
                        {t('results')}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

