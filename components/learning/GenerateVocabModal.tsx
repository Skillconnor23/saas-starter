'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { addFlashcardCardsBulkAction } from '@/lib/actions/learning/flashcards';
import {
  aiVocabItemToCard,
  type AIVocabItem,
  type AIVocabResult,
} from '@/lib/ai/schemas';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';

type Props = {
  deckId: string;
  onClose: () => void;
};

export function GenerateVocabModal({ deckId, onClose }: Props) {
  const t = useTranslations('teacher.flashcards');
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [studentLanguage, setStudentLanguage] = useState('Mongolian');
  const [count, setCount] = useState(8);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AIVocabResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          level: level.trim(),
          studentLanguage: studentLanguage.trim(),
          count,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to generate vocabulary');
        return;
      }
      setDraft(json.data);
      setStep('review');
    } catch {
      setError('Failed to generate vocabulary');
    } finally {
      setGenerating(false);
    }
  }

  function updateItem(index: number, field: keyof AIVocabItem, value: string) {
    if (!draft) return;
    const next = [...draft.items];
    next[index] = { ...next[index], [field]: value };
    setDraft({ ...draft, items: next });
  }

  function removeItem(index: number) {
    if (!draft) return;
    const next = draft.items.filter((_, i) => i !== index);
    setDraft({ ...draft, items: next });
  }

  async function handleSave() {
    if (!draft || draft.items.length === 0) {
      setError('No items to save');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const cards = draft.items
        .filter((i) => (i.word?.trim() || i.translation?.trim()))
        .map((item) => aiVocabItemToCard(item));
      const result = await addFlashcardCardsBulkAction(deckId, cards);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError('Failed to save cards');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#e5e7eb] bg-white shadow-lg">
        <div className="flex-shrink-0 border-b border-[#e5e7eb] px-6 py-4">
          <h3 className="text-lg font-medium text-[#1f2937]">
            {step === 'form' ? t('aiModalTitle') : t('aiReviewTitle')}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'form' ? (
            <form id="ai-generate-form" onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('aiTopicLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder={t('aiTopicPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('aiLevelLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  required
                  placeholder={t('aiLevelPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('aiStudentLanguageLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  value={studentLanguage}
                  onChange={(e) => setStudentLanguage(e.target.value)}
                  required
                  placeholder={t('aiStudentLanguagePlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('aiCountLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('aiNotesLabel')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={t('aiNotesPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {draft && (
                <>
                  <div>
                    <label className="text-sm font-medium text-[#1f2937]">
                      {t('aiDraftTitle')}
                    </label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) =>
                        setDraft({ ...draft, title: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    {draft.items.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-[#e5e7eb] bg-gray-50/50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 rounded-full p-0 text-[#b64b29] hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              {t('aiWordLabel')}
                            </label>
                            <input
                              value={item.word}
                              onChange={(e) =>
                                updateItem(index, 'word', e.target.value)
                              }
                              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              {t('aiTranslationLabel')}
                            </label>
                            <input
                              value={item.translation}
                              onChange={(e) =>
                                updateItem(index, 'translation', e.target.value)
                              }
                              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-xs font-medium text-muted-foreground">
                            {t('aiDefinitionLabel')}
                          </label>
                          <input
                            value={item.definition}
                            onChange={(e) =>
                              updateItem(index, 'definition', e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              {t('aiExampleLabel')}
                            </label>
                            <input
                              value={item.example}
                              onChange={(e) =>
                                updateItem(index, 'example', e.target.value)
                              }
                              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              {t('aiPronunciationLabel')}
                            </label>
                            <input
                              value={item.pronunciation}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  'pronunciation',
                                  e.target.value
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {draft.items.length === 0 && (
                    <p className="rounded-xl border border-dashed border-[#e5e7eb] p-4 text-center text-sm text-muted-foreground">
                      No items left. Regenerate or close.
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
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-full"
          >
            {t('aiCancel')}
          </Button>
          <div className="flex gap-2">
            {step === 'review' && draft && draft.items.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="rounded-full"
                >
                  {t('aiRegenerate')}
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
                      {t('aiSaving')}
                    </>
                  ) : (
                    t('aiSaveToDeck')
                  )}
                </Button>
              </>
            )}
            {step === 'form' && (
              <Button
                type="submit"
                form="ai-generate-form"
                disabled={generating || !topic.trim() || !level.trim() || !studentLanguage.trim()}
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
                    {t('aiGenerate')}
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
