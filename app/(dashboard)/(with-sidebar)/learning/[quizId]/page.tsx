export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getQuizForStudentAction, submitQuizAction } from '@/lib/actions/quizzes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizTakePage({ params }: Props) {
  const { quizId } = await params;
  const data = await getQuizForStudentAction(quizId);
  const { quiz, submission } = data;

  return (
    <section className="flex-1">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-1">
        <Link
          href="/dashboard/student/learning?tab=quizzes"
          className="flex items-center gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learning
        </Link>
      </Button>
      <div className="mb-4">
        <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
          {quiz.title}
        </h1>
      </div>


      {submission ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-muted-foreground mb-1">Your score</p>
            <p className="text-3xl font-semibold text-[#7daf41]">
              {submission.score}%
            </p>
          </div>
          <div className="space-y-3">
            {quiz.questions.map((q, index) => {
              const answer = (submission.answers as { questionId: string; value: unknown }[] | null)?.find(
                (a) => a.questionId === q.id
              );
              const correctVal = q.correctAnswer;
              let isCorrect = false;
              if (answer && q.type === 'MCQ' && typeof answer.value === 'string' && typeof correctVal === 'string') {
                isCorrect = answer.value === correctVal;
              } else if (answer && q.type === 'TRUE_FALSE' && typeof correctVal === 'boolean') {
                isCorrect = answer.value === correctVal;
              } else if (answer && q.type === 'FILL_BLANK' && typeof answer.value === 'string' && typeof correctVal === 'string') {
                isCorrect = answer.value.trim().toLowerCase() === correctVal.trim().toLowerCase();
              }
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 space-y-2"
                >
                  <p className="text-xs text-muted-foreground">
                    Question {index + 1} of {quiz.questions.length}
                  </p>
                  <p className="font-medium text-[#1f2937]">{q.prompt}</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isCorrect
                        ? 'bg-[#7daf41]/10 text-[#7daf41]'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form
          action={async (formData) => {
            'use server';
            const answers = quiz.questions.map((q) => {
              const raw = formData.get(`q_${q.id}`);
              let value: unknown = raw;
              if (q.type === 'TRUE_FALSE') {
                value = raw === 'true';
              }
              return {
                questionId: q.id,
                type: q.type as 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK',
                value,
              };
            });

            const result = await submitQuizAction({
              quizId,
              answers,
            });
            if (result.error) {
              throw new Error(result.error);
            }
          }}
          className="space-y-6"
        >
          {quiz.questions.map((q, index) => (
            <div
              key={q.id}
              className="rounded-xl border border-gray-100 bg-white p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Question {index + 1} of {quiz.questions.length}
                </p>
              </div>
              <p className="font-medium text-[#1f2937]">{q.prompt}</p>

              {q.type === 'MCQ' && Array.isArray(q.choices) && (
                <div className="space-y-2">
                  {(q.choices as any[]).map((choice) => (
                    <label
                      key={choice.id ?? choice.value}
                      className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={choice.value}
                        className="h-4 w-4"
                        required
                      />
                      <span>{choice.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'TRUE_FALSE' && (
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'True', value: 'true' },
                    { label: 'False', value: 'false' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt.value}
                        className="h-4 w-4"
                        required
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'FILL_BLANK' && (
                <input
                  type="text"
                  name={`q_${q.id}`}
                  className="w-full rounded-full border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Type your answer"
                  required
                />
              )}
            </div>
          ))}

          <Button
            type="submit"
            className="w-full rounded-full bg-[#7daf41] text-white hover:border-[#7daf41] hover:bg-[#6c9b38]"
          >
            Submit quiz
          </Button>
        </form>
      )}
    </section>
  );
}

