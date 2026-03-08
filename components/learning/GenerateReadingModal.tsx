'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  createReadingFromDraftAction,
  type CreateReadingFromDraftPayload,
} from '@/lib/actions/learning/readings';
import {
  aiReadingToCreatePayload,
  type AIReadingResult,
  type AIGlossaryItem,
  type AIQuestionItem,
} from '@/lib/ai/reading-schemas';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';

type Props = {
  classes: { id: string; name: string }[];
  onClose: () => void;
};

export function GenerateReadingModal({ classes, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [studentLanguage, setStudentLanguage] = useState('Mongolian');
  const [paragraphCount, setParagraphCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AIReadingResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          level: level.trim(),
          studentLanguage: studentLanguage.trim(),
          paragraphCount,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to generate reading');
        return;
      }
      setDraft(json.data);
      setStep('review');
    } catch {
      setError('Failed to generate reading');
    } finally {
      setGenerating(false);
    }
  }

  function updateGlossary(index: number, field: keyof AIGlossaryItem, value: string) {
    if (!draft) return;
    const g = [...(draft.glossary ?? [])];
    g[index] = { ...g[index], [field]: value };
    setDraft({ ...draft, glossary: g });
  }

  function removeGlossary(index: number) {
    if (!draft) return;
    const g = (draft.glossary ?? []).filter((_, i) => i !== index);
    setDraft({ ...draft, glossary: g });
  }

  function updateQuestion(index: number, field: keyof AIQuestionItem, value: string) {
    if (!draft) return;
    const q = [...(draft.questions ?? [])];
    q[index] = { ...q[index], [field]: value };
    setDraft({ ...draft, questions: q });
  }

  function removeQuestion(index: number) {
    if (!draft) return;
    const q = (draft.questions ?? []).filter((_, i) => i !== index);
    setDraft({ ...draft, questions: q });
  }

  async function handleSave() {
    if (!draft || !draft.passage?.trim()) {
      setError('Reading passage is required');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload: CreateReadingFromDraftPayload = aiReadingToCreatePayload(draft);
      const result = await createReadingFromDraftAction(classId, payload);
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError('Failed to create reading');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#e5e7eb] bg-white shadow-lg">
        <div className="flex-shrink-0 border-b border-[#e5e7eb] px-6 py-4">
          <h3 className="text-lg font-medium text-[#1f2937]">
            {step === 'form' ? 'Generate reading with AI' : 'Review and edit'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'form' ? (
            <form id="ai-reading-form" onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  Class <span className="text-[#b64b29]">*</span>
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  Topic <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder="e.g. Places in town"
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  Proficiency level <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  required
                  placeholder="e.g. Beginner"
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  Student language <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={studentLanguage}
                  onChange={(e) => setStudentLanguage(e.target.value)}
                  required
                  placeholder="e.g. Mongolian"
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  Number of paragraphs
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={paragraphCount}
                  onChange={(e) => setParagraphCount(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">Lesson notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Students learned prepositions today"
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {draft && (
                <>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">Title</label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">Instructions</label>
                    <textarea
                      value={draft.instructions ?? ''}
                      onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">Reading passage</label>
                    <textarea
                      value={draft.passage}
                      onChange={(e) => setDraft({ ...draft, passage: e.target.value })}
                      rows={8}
                      className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">Glossary</label>
                    <div className="mt-2 space-y-2">
                      {(draft.glossary ?? []).map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={item.word}
                            onChange={(e) => updateGlossary(i, 'word', e.target.value)}
                            placeholder="Word"
                            className="flex-1 rounded-lg border border-[#e5e7eb] px-2 py-1.5 text-sm"
                          />
                          <input
                            value={item.meaning}
                            onChange={(e) => updateGlossary(i, 'meaning', e.target.value)}
                            placeholder="Meaning"
                            className="flex-1 rounded-lg border border-[#e5e7eb] px-2 py-1.5 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGlossary(i)}
                            className="text-[#b64b29] hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">Comprehension questions</label>
                    <div className="mt-2 space-y-2">
                      {(draft.questions ?? []).map((q, i) => (
                        <div key={i} className="rounded-xl border border-[#e5e7eb] bg-gray-50/50 p-3">
                          <input
                            value={q.prompt}
                            onChange={(e) => updateQuestion(i, 'prompt', e.target.value)}
                            placeholder="Question"
                            className="mb-2 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                          />
                          <input
                            value={q.answer}
                            onChange={(e) => updateQuestion(i, 'answer', e.target.value)}
                            placeholder="Answer (for teacher)"
                            className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(i)}
                            className="mt-2 text-[#b64b29] hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
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
            Cancel
          </Button>
          <div className="flex gap-2">
            {step === 'review' && draft && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="rounded-full"
                >
                  Regenerate
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
                      Creating…
                    </>
                  ) : (
                    'Create reading'
                  )}
                </Button>
              </>
            )}
            {step === 'form' && (
              <Button
                type="submit"
                form="ai-reading-form"
                disabled={generating || !classId || !topic.trim() || !level.trim() || !studentLanguage.trim()}
                className="rounded-full bg-[#429ead] text-white hover:bg-[#36899a]"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
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
