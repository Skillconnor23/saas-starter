'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  createHomeworkFromDraftAction,
  type CreateHomeworkFromDraftPayload,
} from '@/lib/actions/homework';
import {
  aiHomeworkToCreatePayload,
  type AIHomeworkResult,
  type AIHomeworkTask,
  type AITaskType,
} from '@/lib/ai/homework-schemas';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';

const TASK_TYPE_LABELS: Record<AITaskType, string> = {
  fill_in_blank: 'Fill in the blank',
  short_answer: 'Short answer',
  speaking: 'Speaking',
  writing: 'Writing',
  reading_comprehension: 'Reading',
};

type Props = {
  classes: { id: string; name: string }[];
  onClose: () => void;
  vocabItems?: Array<{ word: string; translation?: string }>;
  reading?: { title?: string; passage?: string };
};

export function GenerateHomeworkModal({
  classes,
  onClose,
  vocabItems,
  reading,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [studentLanguage, setStudentLanguage] = useState('Mongolian');
  const [taskCount, setTaskCount] = useState(5);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AIHomeworkResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          level: level.trim(),
          studentLanguage: studentLanguage.trim(),
          taskCount,
          notes: notes.trim() || undefined,
          vocabItems:
            vocabItems && vocabItems.length > 0
              ? vocabItems.map((v) => ({ word: v.word, translation: v.translation }))
              : undefined,
          reading:
            reading?.passage?.trim()
              ? { title: reading.title, passage: reading.passage }
              : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to generate homework');
        return;
      }
      setDraft(json.data);
      setStep('review');
    } catch {
      setError('Failed to generate homework');
    } finally {
      setGenerating(false);
    }
  }

  function updateTask(index: number, field: keyof AIHomeworkTask, value: string | null) {
    if (!draft) return;
    const t = [...draft.tasks];
    t[index] = { ...t[index], [field]: value };
    setDraft({ ...draft, tasks: t });
  }

  function removeTask(index: number) {
    if (!draft) return;
    const t = draft.tasks.filter((_, i) => i !== index);
    setDraft({ ...draft, tasks: t });
  }

  async function handleSave() {
    if (!draft || !draft.title?.trim()) {
      setError('Title is required');
      return;
    }
    const payload: CreateHomeworkFromDraftPayload = aiHomeworkToCreatePayload(draft);
    if (!payload.instructions?.trim()) {
      setError('Instructions are required');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await createHomeworkFromDraftAction(classId, payload);
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError('Failed to create homework');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#e5e7eb] bg-white shadow-lg">
        <div className="flex-shrink-0 border-b border-[#e5e7eb] px-6 py-4">
          <h3 className="text-lg font-medium text-[#1f2937]">
            {step === 'form' ? 'Generate homework with AI' : 'Review and edit'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'form' ? (
            <form id="ai-homework-form" onSubmit={handleGenerate} className="space-y-4">
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
                  Number of tasks
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={taskCount}
                  onChange={(e) => setTaskCount(Number(e.target.value) || 1)}
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
              {vocabItems && vocabItems.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Using {vocabItems.length} vocab item(s) from current context
                </p>
              )}
              {reading?.passage && (
                <p className="text-xs text-muted-foreground">
                  Using reading passage for optional comprehension tasks
                </p>
              )}
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
                      value={draft.instructions}
                      onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">Tasks</label>
                    <div className="mt-2 space-y-3">
                      {draft.tasks.map((task, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-[#e5e7eb] bg-gray-50/50 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              {TASK_TYPE_LABELS[task.type as AITaskType] ?? task.type}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTask(i)}
                              className="h-8 text-[#b64b29] hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <input
                            value={task.prompt}
                            onChange={(e) => updateTask(i, 'prompt', e.target.value)}
                            placeholder="Task prompt"
                            className="mb-2 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                          />
                          {task.answer != null && task.answer !== '' && (
                            <input
                              value={task.answer}
                              onChange={(e) => updateTask(i, 'answer', e.target.value || null)}
                              placeholder="Answer (for teacher)"
                              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm text-muted-foreground"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {draft.teacherNotes && (
                    <div>
                      <label className="text-sm font-medium text-[#1f2937]">Teacher notes</label>
                      <textarea
                        value={draft.teacherNotes}
                        onChange={(e) => setDraft({ ...draft, teacherNotes: e.target.value })}
                        rows={2}
                        placeholder="Optional grading tips"
                        className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Not saved to homework; for your reference only
                      </p>
                    </div>
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
                    'Create homework'
                  )}
                </Button>
              </>
            )}
            {step === 'form' && (
              <Button
                type="submit"
                form="ai-homework-form"
                disabled={
                  generating || !classId || !topic.trim() || !level.trim() || !studentLanguage.trim()
                }
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
