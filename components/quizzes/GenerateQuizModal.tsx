'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  addQuestionsBulkAction,
  updateQuizMetadataAction,
} from '@/lib/actions/quizzes';
import {
  aiQuestionToCreatePayload,
  type AIQuizQuestion,
  type AIQuizResult,
} from '@/lib/ai/quiz-schemas';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';

type Props = {
  quizId: string;
  onClose: () => void;
};

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'fill_in_blank', label: 'Fill in blank' },
  { value: 'true_false', label: 'True / False' },
] as const;

export function GenerateQuizModal({ quizId, onClose }: Props) {
  const t = useTranslations('teacher.quizzes');
  const tAi = useTranslations('teacher.quizzes.ai');
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [studentLanguage, setStudentLanguage] = useState('Mongolian');
  const [questionCount, setQuestionCount] = useState(6);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice', 'fill_in_blank', 'true_false']);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AIQuizResult | null>(null);

  function toggleQuestionType(value: string) {
    setQuestionTypes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          level: level.trim(),
          studentLanguage: studentLanguage.trim(),
          questionCount,
          questionTypes: questionTypes.length ? questionTypes : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || tAi('generateError'));
        return;
      }
      setDraft(json.data);
      setStep('review');
    } catch {
      setError(tAi('generateError'));
    } finally {
      setGenerating(false);
    }
  }

  function updateQuestion(index: number, updates: Partial<AIQuizQuestion>) {
    if (!draft) return;
    const next = [...draft.questions];
    next[index] = { ...next[index], ...updates } as AIQuizQuestion;
    setDraft({ ...draft, questions: next });
  }

  function updateMcqOption(index: number, optionIndex: number, value: string) {
    if (!draft) return;
    const q = draft.questions[index];
    if (q?.type !== 'multiple_choice' || !q.options) return;
    const nextOptions = [...q.options];
    nextOptions[optionIndex] = value;
    updateQuestion(index, { options: nextOptions });
  }

  function removeQuestion(index: number) {
    if (!draft) return;
    const next = draft.questions.filter((_, i) => i !== index);
    setDraft({ ...draft, questions: next });
  }

  async function handleSave() {
    if (!draft || draft.questions.length === 0) {
      setError(tAi('noQuestionsToSave'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payloads = draft.questions
        .map((q) => aiQuestionToCreatePayload(q))
        .filter((p): p is NonNullable<typeof p> => p !== null && p.prompt.trim().length > 0);

      if (payloads.length === 0) {
        setError(tAi('noValidQuestions'));
        setSaving(false);
        return;
      }

      const metaResult = await updateQuizMetadataAction(quizId, {
        title: draft.title.trim() || undefined,
        description: draft.instructions?.trim() || null,
      });
      if (metaResult.error) {
        setError(metaResult.error);
        setSaving(false);
        return;
      }

      const result = await addQuestionsBulkAction(quizId, payloads);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError(tAi('saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#e5e7eb] bg-white shadow-lg">
        <div className="flex-shrink-0 border-b border-[#e5e7eb] px-6 py-4">
          <h3 className="text-lg font-medium text-[#1f2937]">
            {step === 'form' ? tAi('modalTitle') : tAi('reviewTitle')}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'form' ? (
            <form id="ai-quiz-form" onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {tAi('topicLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder={tAi('topicPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {tAi('levelLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  required
                  placeholder={tAi('levelPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {tAi('studentLanguageLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={studentLanguage}
                  onChange={(e) => setStudentLanguage(e.target.value)}
                  required
                  placeholder={tAi('studentLanguagePlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {tAi('questionCountLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">{tAi('questionTypesLabel')}</label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {QUESTION_TYPES.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={questionTypes.includes(value)}
                        onChange={() => toggleQuestionType(value)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">{tAi('notesLabel')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={tAi('notesPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {draft && (
                <>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">{tAi('quizTitleLabel')}</label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">{tAi('instructionsLabel')}</label>
                    <textarea
                      value={draft.instructions ?? ''}
                      onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    {draft.questions.map((q, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-[#e5e7eb] bg-gray-50/50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            #{index + 1} · {q.type.replace('_', ' ')}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="h-8 w-8 rounded-full p-0 text-[#b64b29] hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">{tAi('promptLabel')}</label>
                            <input
                              value={q.prompt}
                              onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                          {q.type === 'multiple_choice' && q.options && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">{tAi('optionsLabel')}</label>
                              <div className="mt-1 space-y-1">
                                {q.options.map((opt, i) => (
                                  <input
                                    key={i}
                                    value={opt}
                                    onChange={(e) => updateMcqOption(index, i, e.target.value)}
                                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                                    placeholder={`Option ${i + 1}`}
                                  />
                                ))}
                              </div>
                              <div className="mt-2">
                                <label className="text-xs font-medium text-muted-foreground">{tAi('correctAnswerLabel')}</label>
                                <input
                                  value={q.answer}
                                  onChange={(e) => updateQuestion(index, { answer: e.target.value })}
                                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                                />
                              </div>
                            </div>
                          )}
                          {q.type === 'fill_in_blank' && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">{tAi('correctAnswerLabel')}</label>
                              <input
                                value={q.answer}
                                onChange={(e) => updateQuestion(index, { answer: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                              />
                            </div>
                          )}
                          {q.type === 'true_false' && (
                            <div className="flex gap-2">
                              {[true, false].map((v) => (
                                <label key={String(v)} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`tf-${index}`}
                                    checked={q.answer === v}
                                    onChange={() => updateQuestion(index, { answer: v })}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{v ? 'True' : 'False'}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">{tAi('explanationLabel')}</label>
                            <input
                              value={q.explanation ?? ''}
                              onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {draft.questions.length === 0 && (
                    <p className="rounded-xl border border-dashed border-[#e5e7eb] p-4 text-center text-sm text-muted-foreground">
                      {tAi('noQuestionsLeft')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-[#e5e7eb] px-6 py-2">
            <p className="text-sm text-[#b64b29]">{error}</p>
          </div>
        )}

        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-full">
            {tAi('cancel')}
          </Button>
          <div className="flex gap-2">
            {step === 'review' && draft && draft.questions.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="rounded-full"
                >
                  {tAi('regenerate')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tAi('saving')}
                    </>
                  ) : (
                    tAi('saveToQuiz')
                  )}
                </Button>
              </>
            )}
            {step === 'form' && (
              <Button
                type="submit"
                form="ai-quiz-form"
                disabled={generating || !topic.trim() || !level.trim() || !studentLanguage.trim()}
                className="rounded-full bg-[#429ead] text-white hover:bg-[#36899a]"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tAi('generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {tAi('generate')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
