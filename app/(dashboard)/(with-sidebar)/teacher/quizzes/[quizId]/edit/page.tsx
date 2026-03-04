export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import {
  getQuizWithQuestions,
  getQuizClassIds,
} from '@/lib/db/queries/quizzes';
import { getClassesForTeacherWithDetails } from '@/lib/db/queries/education';
import {
  publishQuizAction,
  updateQuizAction,
  deleteQuestionAction,
} from '@/lib/actions/quizzes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AddQuestionButton } from '@/components/quizzes/AddQuestionButton';

type Props = { params: Promise<{ quizId: string }> };

export default async function EditQuizPage({ params }: Props) {
  const { quizId } = await params;
  const user = await requireRole(['teacher']);
  const t = await getTranslations('teacher.quizzes');
  const [quiz, classIds, classes] = await Promise.all([
    getQuizWithQuestions(quizId),
    getQuizClassIds(quizId),
    getClassesForTeacherWithDetails(user.id),
  ]);
  if (!quiz || quiz.createdByUserId !== user.id) {
    redirect('/teacher/quizzes');
  }

  const canPublish = quiz.questions.length >= 1;

  return (
    <section className="flex-1">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-1">
        <Link href="/teacher/quizzes" className="flex items-center gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('backToQuizzes')}
        </Link>
      </Button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
            {t('editQuizTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {quiz.title} · {quiz.status === 'PUBLISHED' ? t('publishedOrDraft') : t('publishedOrDraftDraft')}
          </p>
        </div>
        {quiz.status !== 'PUBLISHED' && (
          <form
            action={async () => {
              'use server';
              await publishQuizAction(quizId);
            }}
          >
            <Button
              type="submit"
              disabled={!canPublish}
              className="rounded-full bg-[#7daf41] text-white hover:border-[#7daf41] hover:bg-[#6c9b38] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('publishQuiz')}
            </Button>
          </form>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('quizDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                'use server';
                await updateQuizAction(quizId, formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('titleLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  defaultValue={quiz.title}
                  className="w-full rounded-full border border-gray-200 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('descriptionOptional')}
                </label>
                <textarea
                  name="description"
                  defaultValue={quiz.description ?? ''}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('assignToClasses')}
                </label>
                <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 p-3">
                  {classes.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="classIds"
                        value={c.id}
                        defaultChecked={classIds.includes(c.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-[#429ead] text-white hover:border-[#429ead] hover:bg-[#36899a]"
              >
                {t('saveQuiz')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('questions')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {quiz.questions.length === 0
                ? t('addOneToPublish')
                : t('questionsCount', { count: quiz.questions.length })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.questions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                {t('noQuestionsYet')}
              </p>
            ) : (
              quiz.questions.map((q, index) => {
                const choices = Array.isArray(q.choices)
                  ? (q.choices as { label: string; value: string }[])
                  : [];
                const correctValue =
                  typeof q.correctAnswer === 'string' ? q.correctAnswer : null;
                return (
                  <div
                    key={q.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {t('questionNumber', { number: index + 1 })}
                        </p>
                        <p className="font-medium text-[#1f2937] mt-0.5">
                          {q.prompt}
                        </p>
                        {choices.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {choices.map((opt, i) => (
                              <li
                                key={i}
                                className={`text-sm ${
                                  opt.value === correctValue
                                    ? 'text-[#7daf41] font-medium'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {opt.label}
                                {opt.value === correctValue && (
                                  <span className="ml-1 text-xs">{t('correct')}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <form
                        action={async () => {
                          'use server';
                          await deleteQuestionAction(quizId, q.id);
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {t('remove')}
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}

            <AddQuestionButton quizId={quizId} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
