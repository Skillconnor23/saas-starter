export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getTeacherQuizResultsAction } from '@/lib/actions/quizzes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Props = { params: Promise<{ quizId: string }> };

export default async function QuizResultsPage({ params }: Props) {
  const { quizId } = await params;
  await requireRole(['teacher', 'admin', 'school_admin']);
  const t = await getTranslations('teacher.quizzes');
  const data = await getTeacherQuizResultsAction(quizId);
  const { quiz, submissions } = data;

  const submittedCount = submissions.length;
  const avgScore =
    submittedCount === 0
      ? null
      : Math.round(
          submissions.reduce((acc, s) => acc + s.submission.score, 0) /
            submittedCount
        );

  return (
    <section className="flex-1">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-1">
        <Link href="/teacher/quizzes" className="flex items-center gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('backToQuizzes')}
        </Link>
      </Button>
      <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-2 tracking-tight">
        {t('resultsTitle')}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{quiz.title}</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t('submissions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-[#1f2937]">
                {submittedCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t('averageScore')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-[#1f2937]">
                {avgScore != null ? `${avgScore}%` : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('studentScores')}</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('noSubmissionsYet')}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('student')}</TableHead>
                    <TableHead>{t('submitted')}</TableHead>
                    <TableHead className="text-right">{t('score')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(({ submission, student }) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {student.name || student.email}
                      </TableCell>
                      <TableCell>
                        {new Date(
                          submission.submittedAt
                        ).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {submission.score}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

