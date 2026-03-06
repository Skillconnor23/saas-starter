'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PLACEMENT_QUESTIONS, type PlacementQuestion } from '@/lib/level-check/questions';
import { submitPlacementAction } from '@/lib/actions/level-check';
import { cn } from '@/lib/utils';

const TOTAL = PLACEMENT_QUESTIONS.length;

type AnswerValue = string | string[];

export function PlacementTest() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [writingResponses, setWritingResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderWords, setOrderWords] = useState<string[]>([]);

  const question = PLACEMENT_QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / TOTAL) * 100;

  const handleMultipleChoice = useCallback((value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }, [question?.id]);

  const handleOrderSelect = useCallback((word: string) => {
    setOrderWords((prev) => [...prev, word]);
  }, []);

  const handleOrderRemove = useCallback((idx: number) => {
    setOrderWords((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleOrderReset = useCallback(() => {
    setOrderWords([]);
  }, []);

  const handleNext = useCallback(() => {
    if (question?.type === 'sentence_ordering') {
      setAnswers((prev) => ({ ...prev, [question.id]: [...orderWords] }));
      setOrderWords([]);
    }
    if (currentIndex < TOTAL - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, question?.id, question?.type, orderWords]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const finalAnswers = { ...answers };
      if (question?.type === 'sentence_ordering') {
        finalAnswers[question.id] = [...orderWords];
      }
      const answersList = Object.entries(finalAnswers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      const finalWriting = { ...writingResponses };
      if (question?.type === 'writing') {
        const text = (document.querySelector(`textarea[name="q_${question.id}"]`) as HTMLTextAreaElement)?.value ?? '';
        finalWriting[question.id] = text;
      }
      const writingList = Object.entries(finalWriting).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await submitPlacementAction(answersList, writingList);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }, [answers, orderWords, question, writingResponses]);

  const hasAnswer = (q: PlacementQuestion) => {
    if (q.type === 'writing') return true;
    if (q.type === 'sentence_ordering') return orderWords.length > 0;
    return answers[q.id] !== undefined;
  };

  const canProceed = hasAnswer(question);

  return (
    <div className="min-h-[60vh] px-4 py-6 sm:px-6 sm:py-8">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Question {currentIndex + 1} of {TOTAL}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#7daf41] transition-all duration-300"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-lg font-medium text-[#3d4236]">{question.prompt}</p>

        {question.type === 'multiple_choice' && question.choices && (
          <div className="mt-6 space-y-3">
            {question.choices.map((choice) => (
              <label
                key={choice.value}
                className={cn(
                  'flex min-h-14 cursor-pointer items-center rounded-xl border-2 px-4 py-3 transition-colors',
                  answers[question.id] === choice.value
                    ? 'border-[#7daf41] bg-[#7daf41]/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  value={choice.value}
                  checked={answers[question.id] === choice.value}
                  onChange={() => handleMultipleChoice(choice.value)}
                  className="h-5 w-5 accent-[#7daf41]"
                />
                <span className="ml-3 text-base font-medium text-[#3d4236]">
                  {choice.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'vocabulary' && question.choices && (
          <div className="mt-6 space-y-3">
            {question.choices.map((choice) => (
              <label
                key={choice.value}
                className={cn(
                  'flex min-h-14 cursor-pointer items-center rounded-xl border-2 px-4 py-3 transition-colors',
                  answers[question.id] === choice.value
                    ? 'border-[#7daf41] bg-[#7daf41]/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  value={choice.value}
                  checked={answers[question.id] === choice.value}
                  onChange={() => handleMultipleChoice(choice.value)}
                  className="h-5 w-5 accent-[#7daf41]"
                />
                <span className="ml-3 text-base font-medium text-[#3d4236]">
                  {choice.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'sentence_ordering' && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">
              Tap words in order. Selected: {orderWords.length > 0 ? orderWords.join(' ') : '(none)'}
            </p>
            <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {orderWords.map((w, i) => (
                <button
                  key={`${w}-${i}`}
                  type="button"
                  onClick={() => handleOrderRemove(i)}
                  className="rounded-full bg-[#7daf41] px-4 py-2 text-sm font-medium text-white"
                >
                  {w} ×
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {shuffleForQuestion([...(question.correctOrder ?? [])], question.id).map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => handleOrderSelect(word)}
                  disabled={orderWords.includes(word)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-[#3d4236] hover:bg-slate-50 disabled:opacity-50"
                >
                  {word}
                </button>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleOrderReset}>
              Reset
            </Button>
          </div>
        )}

        {question.type === 'writing' && (
          <div className="mt-6">
            <textarea
              name={`q_${question.id}`}
              placeholder={question.placeholder ?? 'Type your response here...'}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-[#7daf41] focus:outline-none focus:ring-2 focus:ring-[#7daf41]/20"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="min-h-12 min-w-[120px] rounded-full"
        >
          Back
        </Button>
        {currentIndex < TOTAL - 1 ? (
          <Button
            type="button"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed}
            className="min-h-12 min-w-[120px] rounded-full bg-[#7daf41] hover:bg-[#6b9a39]"
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-h-12 min-w-[140px] rounded-full bg-[#7daf41] hover:bg-[#6b9a39]"
          >
            {isSubmitting ? 'Submitting...' : 'See Results'}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Deterministic shuffle per question so order stays stable when re-rendering */
function shuffleForQuestion(arr: string[], questionId: string): string[] {
  const seed = questionId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const r = (Math.sin(seed * 9999 + i * 7777) * 10000) % 1;
    const j = Math.floor((r >= 0 ? r : r + 1) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
